import { BigNumber, Signature } from "ethers";
import { task } from "hardhat/config";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers } from "hardhat";

let manager_addr = "0x57E9094f501573e6Eb7e19aCe9D8E263D11fc8ba";

let IDeployFactory_abi = [
    "function deploy(bytes32 salt, bytes memory creationCode, uint256 value) external",
    "function getAddress(bytes32 salt) external view returns (address)",
];

task("deployMappingToken", "addMappingToken")
    .addParam("name", "token name")
    .addParam("symbol", "token symbol")
    .addOptionalParam("decimals", "decimals, default is 18", 18, types.int)
    .addOptionalParam("admin", "admin address, default is deployer", "", types.string)
    .setAction(async (taskArgs, HardhatRuntimeEnvironment) => {
        const { deployments, getNamedAccounts, ethers } = HardhatRuntimeEnvironment;
        const { deploy } = deployments;
        const { deployer } = await getNamedAccounts();
        console.log("deployer:", deployer);

        let admin = taskArgs.admin;
        if (taskArgs.admin === "") {
            admin = deployer;
        }

        // let Token = await ethers.getContractFactory("MappingToken");
        // let token = await Token.deploy(taskArgs.name, taskArgs.symbol, taskArgs.decimals, admin);

        await deploy("MappingToken", {
            from: deployer,
            args: [taskArgs.name, taskArgs.symbol, taskArgs.decimals, admin],
            log: true,
            contract: "MappingToken",
        });

        let token = await deployments.get("MappingToken");

        console.log("token ==", token.address);
    });

task("deployMappingTokenWithFactory", "addMappingToken")
    .addParam("name", "token name")
    .addParam("symbol", "token symbol")
    .addParam("salt", "deploy salt")
    .addOptionalParam("decimals", "decimals, default is 18", 18, types.int)
    .addOptionalParam("admin", "admin address, default is deployer", "", types.string)
    .addOptionalParam(
        "factory",
        "deploy factory address, default is 0x6258e4d2950757A749a4d4683A7342261ce12471",
        "0x6258e4d2950757A749a4d4683A7342261ce12471"
    )
    .setAction(async (taskArgs, HardhatRuntimeEnvironment) => {
        const { deployments, getNamedAccounts, ethers } = HardhatRuntimeEnvironment;
        const { deploy } = deployments;
        const { deployer } = await getNamedAccounts();
        console.log("deployer:", deployer);

        let admin = taskArgs.admin;
        if (taskArgs.admin === "") {
            admin = deployer;
        }

        console.log("token admin :", admin);

        let factory = await ethers.getContractAt(IDeployFactory_abi, taskArgs.factory);
        let salt_hash = await ethers.utils.keccak256(await ethers.utils.toUtf8Bytes(taskArgs.salt));
        console.log("deploy factory address:", factory.address);
        console.log("deploy salt:", taskArgs.salt);
        let addr = await factory.getAddress(salt_hash);
        console.log("deployed to :", addr);

        let param = ethers.utils.defaultAbiCoder.encode(
            ["string", "string", "uint8", "address"],
            [taskArgs.name, taskArgs.symbol, taskArgs.decimals, admin]
        );

        let code = await ethers.provider.getCode(addr);
        let redeploy = false;
        if (code !== "0x") {
            console.log("token already deployed", addr);
            return;
        }
        let token = await ethers.getContractFactory("MappingToken");

        let create_code = ethers.utils.solidityPack(["bytes", "bytes"], [token.bytecode, param]);
        let create = await (await factory.deploy(salt_hash, create_code, 0)).wait();
        if (create.status == 1) {
            console.log("deployed to :", addr);
            redeploy = true;
        } else {
            console.log("deploy fail");
            throw "deploy fail";
        }
    });

task("grantTokenRole", "grantRole")
    .addParam("token", "role")
    .addParam("role", "role")
    .addParam("addr", "role address")
    .setAction(async (taskArgs, HardhatRuntimeEnvironment) => {
        const { deployments, getNamedAccounts, ethers } = HardhatRuntimeEnvironment;
        const { deploy } = deployments;
        const { deployer } = await getNamedAccounts();

        console.log("deployer:", deployer);
        let Token = await ethers.getContractFactory("MappingToken");
        let token = Token.attach(taskArgs.token);
        let role;
        if (taskArgs.role === "DEFAULT_ADMIN_ROLE") {
            role = ethers.constants.HashZero;
        } else {
            role = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(taskArgs.role));
        }
        await (await token.grantRole(role, taskArgs.addr)).wait();
    });

task("revokeTokenRole", "grantRole")
    .addParam("token", "role")
    .addParam("role", "role")
    .addParam("addr", "role address")
    .setAction(async (taskArgs, HardhatRuntimeEnvironment) => {
        const { deployments, getNamedAccounts, ethers } = HardhatRuntimeEnvironment;
        const { deploy } = deployments;
        const { deployer } = await getNamedAccounts();

        console.log("deployer:", deployer);
        let Token = await ethers.getContractFactory("MappingToken");
        let token = Token.attach(taskArgs.token);
        let role;
        if (taskArgs.role === "DEFAULT_ADMIN_ROLE") {
            role = ethers.constants.HashZero;
        } else {
            role = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(taskArgs.role));
        }
        await (await token.revokeRole(role, taskArgs.addr)).wait();
    });

task("mintToken", "mint token")
    .addParam("token", "token address")
    .addParam("to", "mint address ")
    .addParam("amount", "mint amount")
    .setAction(async (taskArgs, HardhatRuntimeEnvironment) => {
        const { deployments, getNamedAccounts, ethers } = HardhatRuntimeEnvironment;
        const { deploy } = deployments;
        const { deployer } = await getNamedAccounts();

        console.log("deployer:", deployer);
        let Token = await ethers.getContractFactory("MappingToken");
        let token = Token.attach(taskArgs.token);
        await (await token.mint(taskArgs.to, taskArgs.amount)).wait();
    });
task("setMintCap", "setMinterCap")
    .addParam("token", "token addr")
    .addParam("addr", "minter addr")
    .addParam("cap", "cap")
    .setAction(async (taskArgs, HardhatRuntimeEnvironment) => {
        const { deployments, getNamedAccounts, ethers } = HardhatRuntimeEnvironment;
        const { deploy } = deployments;
        const { deployer } = await getNamedAccounts();
        console.log("deployer:", deployer);
        let Token = await ethers.getContractFactory("MappingToken");
        let token = Token.attach(taskArgs.token);
        console.log("before: ", await token.getMinterCap(taskArgs.addr));
        await (await token.setMinterCap(taskArgs.addr, ethers.utils.parseEther(taskArgs.cap))).wait();
        console.log("after : ", await token.getMinterCap(taskArgs.addr));
    });
