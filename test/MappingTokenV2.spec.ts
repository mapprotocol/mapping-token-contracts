import { expect } from "chai";
import { BigNumber, BigNumberish } from "ethers";
import { ethers } from "hardhat";

const { AddressZero, HashZero, MaxUint256 } = ethers.constants;

describe("MappingTokenV2", function () {
    // OZ 4.x AccessControl reverts with this exact string when a role check fails
    function missingRole(account: string, role: string): string {
        return `AccessControl: account ${account.toLowerCase()} is missing role ${role}`;
    }

    async function deployFixture(decimals = 18) {
        const [deployer, admin, pauser, minter, user, spender] = await ethers.getSigners();
        const Token = await ethers.getContractFactory("MappingTokenV2");
        const token = await Token.deploy("Mapping Token V2", "MTV2", decimals, admin.address);
        await token.deployed();
        return { Token, token, deployer, admin, pauser, minter, user, spender };
    }

    // token with the minter and a mint cap already configured
    async function deployWithMinter(cap: BigNumberish = 1000, decimals = 18) {
        const ctx = await deployFixture(decimals);
        await ctx.token.connect(ctx.admin).setMinter(ctx.minter.address);
        await ctx.token.connect(ctx.admin).setMintCap(cap);
        return ctx;
    }

    // sign an EIP-2612 permit from `owner` to `spender`
    async function signPermit(token: any, owner: any, spender: string, value: BigNumberish, deadline: BigNumberish) {
        const [name, nonce, network] = await Promise.all([
            token.name(),
            token.nonces(owner.address),
            token.provider.getNetwork(),
        ]);
        const domain = { name, version: "1", chainId: network.chainId, verifyingContract: token.address };
        const types = {
            Permit: [
                { name: "owner", type: "address" },
                { name: "spender", type: "address" },
                { name: "value", type: "uint256" },
                { name: "nonce", type: "uint256" },
                { name: "deadline", type: "uint256" },
            ],
        };
        const message = { owner: owner.address, spender, value, nonce, deadline };
        const signature = await owner._signTypedData(domain, types, message);
        return ethers.utils.splitSignature(signature);
    }

    describe("deployment", function () {
        it("sets name, symbol and custom decimals", async function () {
            const { token } = await deployFixture(6);
            expect(await token.name()).to.equal("Mapping Token V2");
            expect(await token.symbol()).to.equal("MTV2");
            expect(await token.decimals()).to.equal(6);
        });

        it("defaults to 18 decimals", async function () {
            const { token } = await deployFixture();
            expect(await token.decimals()).to.equal(18);
        });

        it("grants DEFAULT_ADMIN_ROLE and PAUSER_ROLE to the admin only", async function () {
            const { token, admin, deployer } = await deployFixture();
            expect(await token.hasRole(HashZero, admin.address)).to.equal(true);
            expect(await token.hasRole(await token.PAUSER_ROLE(), admin.address)).to.equal(true);
            // the deployer receives no privileges
            expect(await token.hasRole(HashZero, deployer.address)).to.equal(false);
        });

        it("starts with no minter, no cap and no supply", async function () {
            const { token } = await deployFixture();
            expect(await token.minter()).to.equal(AddressZero);
            expect(await token.mintCap()).to.equal(0);
            expect(await token.totalSupply()).to.equal(0);
        });

        it("reverts when the admin address is zero", async function () {
            const { Token, token } = await deployFixture();
            await expect(Token.deploy("n", "s", 18, AddressZero)).to.be.revertedWithCustomError(
                token,
                "ZeroAdminAddress"
            );
        });
    });

    describe("setMinter", function () {
        it("lets the admin set the minter and emits UpdateMinter", async function () {
            const { token, admin, minter } = await deployFixture();
            await expect(token.connect(admin).setMinter(minter.address))
                .to.emit(token, "UpdateMinter")
                .withArgs(AddressZero, minter.address);
            expect(await token.minter()).to.equal(minter.address);
        });

        it("reverts when a non-admin sets the minter", async function () {
            const { token, minter, user } = await deployFixture();
            await expect(token.connect(user).setMinter(minter.address)).to.be.revertedWith(
                missingRole(user.address, HashZero)
            );
        });

        it("reverts when setting the minter to the zero address", async function () {
            const { token, admin } = await deployFixture();
            await expect(token.connect(admin).setMinter(AddressZero)).to.be.revertedWithCustomError(
                token,
                "ZeroMinterAddress"
            );
        });

        it("is a no-op when the minter is unchanged", async function () {
            const { token, admin, minter } = await deployFixture();
            await token.connect(admin).setMinter(minter.address);
            await token.connect(admin).setMinter(minter.address); // must not revert
            expect(await token.minter()).to.equal(minter.address);
        });

        it("replaces the previous minter", async function () {
            const { token, admin, minter, user, spender } = await deployFixture();
            await token.connect(admin).setMintCap(1000);
            await token.connect(admin).setMinter(minter.address);
            await token.connect(minter).mint(user.address, 1);

            await expect(token.connect(admin).setMinter(spender.address))
                .to.emit(token, "UpdateMinter")
                .withArgs(minter.address, spender.address);

            // the old minter can no longer mint
            await expect(token.connect(minter).mint(user.address, 1))
                .to.be.revertedWithCustomError(token, "NotMinter")
                .withArgs(minter.address, spender.address);
            // the new minter can
            await token.connect(spender).mint(user.address, 1);
            expect(await token.balanceOf(user.address)).to.equal(2);
        });
    });

    describe("setMintCap", function () {
        it("lets the admin set the cap and emits UpdateMintCap", async function () {
            const { token, admin } = await deployFixture();
            // fresh fixture: previousCap = 0, currentSupply = 0
            await expect(token.connect(admin).setMintCap(5000))
                .to.emit(token, "UpdateMintCap")
                .withArgs(0, 5000, 0);
            expect(await token.mintCap()).to.equal(5000);
        });

        it("reverts when a non-admin sets the cap", async function () {
            const { token, user } = await deployFixture();
            await expect(token.connect(user).setMintCap(5000)).to.be.revertedWith(
                missingRole(user.address, HashZero)
            );
        });

        it("allows lowering the cap below supply; cap 0 is a mint-only freeze", async function () {
            const { token, admin, minter, user } = await deployWithMinter(1000);
            await token.connect(minter).mint(user.address, 600);

            // the cap can be dropped below current supply, down to 0
            // event carries (previousCap, newCap, currentSupply) for monitoring
            await expect(token.connect(admin).setMintCap(0))
                .to.emit(token, "UpdateMintCap")
                .withArgs(1000, 0, 600);
            expect(await token.mintCap()).to.equal(0);

            // minting is frozen
            await expect(token.connect(minter).mint(user.address, 1))
                .to.be.revertedWithCustomError(token, "MintCapExceeded")
                .withArgs(601, 0);

            // transfers and burns keep working while minting is frozen
            await token.connect(user).transfer(minter.address, 100);
            await token.connect(user).approve(minter.address, 50);
            await token.connect(minter).burnFrom(user.address, 50);
            expect(await token.balanceOf(user.address)).to.equal(450);
        });
    });

    describe("mint", function () {
        it("lets the minter mint within the cap", async function () {
            const { token, minter, user } = await deployWithMinter(1000);
            await expect(token.connect(minter).mint(user.address, 700))
                .to.emit(token, "Transfer")
                .withArgs(AddressZero, user.address, 700);
            expect(await token.balanceOf(user.address)).to.equal(700);
            expect(await token.totalSupply()).to.equal(700);
        });

        it("reverts when a non-minter mints", async function () {
            const { token, minter, user, spender } = await deployWithMinter(1000);
            await expect(token.connect(spender).mint(user.address, 1))
                .to.be.revertedWithCustomError(token, "NotMinter")
                .withArgs(spender.address, minter.address);
        });

        it("reverts when minting before a minter is configured", async function () {
            const { token, admin, user } = await deployFixture();
            await token.connect(admin).setMintCap(1000);
            await expect(token.connect(user).mint(user.address, 1))
                .to.be.revertedWithCustomError(token, "NotMinter")
                .withArgs(user.address, AddressZero);
        });

        it("enforces the global mint cap", async function () {
            const { token, minter, user } = await deployWithMinter(1000);
            await token.connect(minter).mint(user.address, 600);
            await expect(token.connect(minter).mint(user.address, 401))
                .to.be.revertedWithCustomError(token, "MintCapExceeded")
                .withArgs(1001, 1000);
        });

        it("allows minting exactly up to the cap", async function () {
            const { token, minter, user } = await deployWithMinter(1000);
            await token.connect(minter).mint(user.address, 1000);
            expect(await token.totalSupply()).to.equal(1000);
            await expect(token.connect(minter).mint(user.address, 1))
                .to.be.revertedWithCustomError(token, "MintCapExceeded")
                .withArgs(1001, 1000);
        });

        it("reverts when minting to the zero address", async function () {
            const { token, minter } = await deployWithMinter(1000);
            await expect(token.connect(minter).mint(AddressZero, 1)).to.be.revertedWith(
                "ERC20: mint to the zero address"
            );
        });

        it("accounts correctly for non-18 decimals", async function () {
            const { token, minter, user } = await deployWithMinter(ethers.utils.parseUnits("10", 6), 6);
            await token.connect(minter).mint(user.address, ethers.utils.parseUnits("7", 6));
            expect(await token.totalSupply()).to.equal(ethers.utils.parseUnits("7", 6));
            await expect(token.connect(minter).mint(user.address, ethers.utils.parseUnits("4", 6)))
                .to.be.revertedWithCustomError(token, "MintCapExceeded")
                .withArgs(ethers.utils.parseUnits("11", 6), ethers.utils.parseUnits("10", 6));
        });
    });

    describe("burn and burnFrom", function () {
        it("lets the minter burn from its own balance", async function () {
            const { token, minter } = await deployWithMinter(1000);
            await token.connect(minter).mint(minter.address, 500);
            await expect(token.connect(minter).burn(200))
                .to.emit(token, "Transfer")
                .withArgs(minter.address, AddressZero, 200);
            expect(await token.totalSupply()).to.equal(300);
            expect(await token.balanceOf(minter.address)).to.equal(300);
        });

        it("reverts when a non-minter burns its own balance", async function () {
            const { token, minter, user } = await deployWithMinter(1000);
            await token.connect(minter).mint(user.address, 100);
            await expect(token.connect(user).burn(50))
                .to.be.revertedWithCustomError(token, "NotMinter")
                .withArgs(user.address, minter.address);
        });

        it("lets the minter burnFrom an account that approved it", async function () {
            const { token, minter, user } = await deployWithMinter(1000);
            await token.connect(minter).mint(user.address, 500);
            await token.connect(user).approve(minter.address, 300);

            await expect(token.connect(minter).burnFrom(user.address, 300))
                .to.emit(token, "Transfer")
                .withArgs(user.address, AddressZero, 300);
            expect(await token.balanceOf(user.address)).to.equal(200);
            expect(await token.totalSupply()).to.equal(200);
            expect(await token.allowance(user.address, minter.address)).to.equal(0);
        });

        it("reverts when a non-minter calls burnFrom even with an allowance", async function () {
            const { token, minter, user, spender } = await deployWithMinter(1000);
            await token.connect(minter).mint(user.address, 500);
            await token.connect(user).approve(spender.address, 300);
            await expect(token.connect(spender).burnFrom(user.address, 300))
                .to.be.revertedWithCustomError(token, "NotMinter")
                .withArgs(spender.address, minter.address);
        });

        it("reverts when burnFrom exceeds the allowance", async function () {
            const { token, minter, user } = await deployWithMinter(1000);
            await token.connect(minter).mint(user.address, 500);
            await token.connect(user).approve(minter.address, 100);
            await expect(token.connect(minter).burnFrom(user.address, 200)).to.be.revertedWith(
                "ERC20: insufficient allowance"
            );
        });

        it("rejects zero-amount mint, burn, and burnFrom", async function () {
            const { token, minter, user } = await deployWithMinter(1000);
            await token.connect(minter).mint(user.address, 100);
            await token.connect(user).approve(minter.address, 100);

            await expect(token.connect(minter).mint(user.address, 0))
                .to.be.revertedWithCustomError(token, "ZeroAmount");
            await expect(token.connect(minter).burn(0))
                .to.be.revertedWithCustomError(token, "ZeroAmount");
            await expect(token.connect(minter).burnFrom(user.address, 0))
                .to.be.revertedWithCustomError(token, "ZeroAmount");
        });
    });

    describe("pause and unpause", function () {
        it("lets a pauser pause and blocks transfers", async function () {
            const { token, admin, pauser, minter, user } = await deployWithMinter(1000);
            await token.connect(admin).grantRole(await token.PAUSER_ROLE(), pauser.address);
            await token.connect(minter).mint(user.address, 100);

            await token.connect(pauser).pause();
            expect(await token.paused()).to.equal(true);
            await expect(token.connect(user).transfer(minter.address, 1)).to.be.revertedWith(
                "ERC20Pausable: token transfer while paused"
            );
        });

        it("reverts when a non-pauser pauses", async function () {
            const { token, user } = await deployFixture();
            await expect(token.connect(user).pause()).to.be.revertedWith(
                missingRole(user.address, await token.PAUSER_ROLE())
            );
        });

        it("lets the admin unpause, but not the pauser", async function () {
            const { token, admin, pauser } = await deployFixture();
            await token.connect(admin).grantRole(await token.PAUSER_ROLE(), pauser.address);
            await token.connect(pauser).pause();

            // the pauser can pause but cannot unpause
            await expect(token.connect(pauser).unpause()).to.be.revertedWith(
                missingRole(pauser.address, HashZero)
            );
            await token.connect(admin).unpause();
            expect(await token.paused()).to.equal(false);
        });

        it("blocks mint, burn and burnFrom while paused", async function () {
            const { token, admin, minter, user } = await deployWithMinter(1000);
            await token.connect(minter).mint(minter.address, 100);
            await token.connect(minter).mint(user.address, 100);
            await token.connect(user).approve(minter.address, 100);

            await token.connect(admin).pause();

            await expect(token.connect(minter).mint(user.address, 1)).to.be.revertedWith(
                "ERC20Pausable: token transfer while paused"
            );
            await expect(token.connect(minter).burn(1)).to.be.revertedWith(
                "ERC20Pausable: token transfer while paused"
            );
            await expect(token.connect(minter).burnFrom(user.address, 1)).to.be.revertedWith(
                "ERC20Pausable: token transfer while paused"
            );
        });
    });

    describe("ERC20Permit", function () {
        it("exposes a domain separator and a zero initial nonce", async function () {
            const { token, user } = await deployFixture();
            expect(await token.nonces(user.address)).to.equal(0);
            expect(await token.DOMAIN_SEPARATOR()).to.not.equal(HashZero);
        });

        it("approves spending through an EIP-2612 permit", async function () {
            const { token, user, spender } = await deployFixture();
            const value = BigNumber.from(1000);

            const { v, r, s } = await signPermit(token, user, spender.address, value, MaxUint256);
            await expect(token.permit(user.address, spender.address, value, MaxUint256, v, r, s))
                .to.emit(token, "Approval")
                .withArgs(user.address, spender.address, value);

            expect(await token.allowance(user.address, spender.address)).to.equal(value);
            expect(await token.nonces(user.address)).to.equal(1);
        });

        it("rejects an expired permit", async function () {
            const { token, user, spender } = await deployFixture();
            const value = BigNumber.from(1000);
            const deadline = 1; // in the past

            const { v, r, s } = await signPermit(token, user, spender.address, value, deadline);
            await expect(
                token.permit(user.address, spender.address, value, deadline, v, r, s)
            ).to.be.revertedWith("ERC20Permit: expired deadline");
        });
    });
});
