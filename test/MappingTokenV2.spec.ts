import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

describe("MappingTokenV2", function () {
    async function expectRevert(txPromise: Promise<unknown>) {
        try {
            await txPromise;
            expect.fail("expected transaction to revert");
        } catch (error: any) {
            expect(error.message).to.match(/revert|AccessControl|Pausable/);
        }
    }

    async function deployFixture(decimals = 18) {
        const [deployer, admin, pauser, minter, user, spender] = await ethers.getSigners();
        const Token = await ethers.getContractFactory("MappingTokenV2");
        const token = await Token.deploy("Mapping Token V2", "MTV2", decimals, admin.address);
        await token.deployed();

        return { token, deployer, admin, pauser, minter, user, spender };
    }

    it("sets admin/pauser role and custom decimals on deploy", async function () {
        const { token, admin } = await deployFixture(6);

        expect(await token.decimals()).to.equal(6);
        expect(await token.hasRole(await token.DEFAULT_ADMIN_ROLE(), admin.address)).to.equal(true);
        expect(await token.hasRole(await token.PAUSER_ROLE(), admin.address)).to.equal(true);
    });

    it("allows only admin to set minter and mint cap", async function () {
        const { token, admin, minter, user } = await deployFixture();

        await expectRevert(token.connect(user).setMinter(minter.address));
        await expectRevert(token.connect(user).setMintCap(100));

        await token.connect(admin).setMinter(minter.address);
        await token.connect(admin).setMintCap(1000);

        expect(await token.minter()).to.equal(minter.address);
        expect(await token.mintCap()).to.deep.equal(BigNumber.from(1000));
    });

    it("allows only the configured minter to mint and enforces global mint cap", async function () {
        const { token, admin, minter, user, spender } = await deployFixture();

        await token.connect(admin).setMinter(minter.address);
        await token.connect(admin).setMintCap(1000);

        await expectRevert(token.connect(spender).mint(user.address, 1));

        await token.connect(minter).mint(user.address, 600);
        await token.connect(minter).mint(user.address, 400);

        expect(await token.balanceOf(user.address)).to.deep.equal(BigNumber.from(1000));
        expect(await token.outstanding()).to.deep.equal(BigNumber.from(1000));
        expect(await token.totalSupply()).to.deep.equal(BigNumber.from(1000));

        await expectRevert(token.connect(minter).mint(user.address, 1));
    });

    it("releases outstanding on burn and burnFrom", async function () {
        const { token, admin, minter, user, spender } = await deployFixture();

        await token.connect(admin).setMinter(minter.address);
        await token.connect(admin).setMintCap(1000);
        await token.connect(minter).mint(user.address, 700);

        await token.connect(user).burn(200);
        expect(await token.outstanding()).to.deep.equal(BigNumber.from(500));
        expect(await token.totalSupply()).to.deep.equal(BigNumber.from(500));

        await token.connect(user).approve(spender.address, 300);
        await token.connect(spender).burnFrom(user.address, 300);

        expect(await token.outstanding()).to.deep.equal(BigNumber.from(200));
        expect(await token.totalSupply()).to.deep.equal(BigNumber.from(200));
        expect(await token.balanceOf(user.address)).to.deep.equal(BigNumber.from(200));
    });

    it("does not allow mint cap to be set below current outstanding", async function () {
        const { token, admin, minter, user } = await deployFixture();

        await token.connect(admin).setMinter(minter.address);
        await token.connect(admin).setMintCap(1000);
        await token.connect(minter).mint(user.address, 600);

        await expectRevert(token.connect(admin).setMintCap(599));
        await token.connect(admin).setMintCap(600);

        expect(await token.mintCap()).to.deep.equal(BigNumber.from(600));
    });

    it("separates pause and unpause permissions", async function () {
        const { token, admin, pauser, minter, user } = await deployFixture();

        await token.connect(admin).grantRole(await token.PAUSER_ROLE(), pauser.address);
        await token.connect(admin).setMinter(minter.address);
        await token.connect(admin).setMintCap(1000);
        await token.connect(minter).mint(user.address, 100);

        await expectRevert(token.connect(user).pause());
        await token.connect(pauser).pause();

        await expectRevert(token.connect(user).transfer(minter.address, 1));
        await expectRevert(token.connect(pauser).unpause());

        await token.connect(admin).unpause();
        await token.connect(user).transfer(minter.address, 1);

        expect(await token.balanceOf(minter.address)).to.deep.equal(BigNumber.from(1));
    });

    it("supports non-18 decimals token accounting", async function () {
        const { token, admin, minter, user } = await deployFixture(6);
        const cap = ethers.utils.parseUnits("10", 6);

        await token.connect(admin).setMinter(minter.address);
        await token.connect(admin).setMintCap(cap);
        await token.connect(minter).mint(user.address, ethers.utils.parseUnits("7", 6));

        expect(await token.decimals()).to.equal(6);
        expect(await token.outstanding()).to.deep.equal(ethers.utils.parseUnits("7", 6));

        await expectRevert(token.connect(minter).mint(user.address, ethers.utils.parseUnits("4", 6)));
    });
});
