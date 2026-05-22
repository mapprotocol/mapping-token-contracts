import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
    attachToken,
    DEFAULT_DEPLOY_FACTORY,
    deployToken,
    deployTokenWithFactory,
    grantOrRevokeRole,
} from "./common";

task("deployMappingToken", "addMappingToken")
    .addParam("name", "token name")
    .addParam("symbol", "token symbol")
    .addOptionalParam("decimals", "decimals, default is 18", 18, types.int)
    .addOptionalParam("admin", "admin address, default is deployer", "", types.string)
    .setAction(async (taskArgs, HardhatRuntimeEnvironment) => {
        await deployToken(HardhatRuntimeEnvironment, "MappingToken", taskArgs);
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
        DEFAULT_DEPLOY_FACTORY
    )
    .setAction(async (taskArgs, HardhatRuntimeEnvironment) => {
        await deployTokenWithFactory(HardhatRuntimeEnvironment, "MappingToken", taskArgs);
    });

task("grantTokenRole", "grantRole")
    .addParam("token", "role")
    .addParam("role", "role")
    .addParam("addr", "role address")
    .setAction(async (taskArgs, HardhatRuntimeEnvironment) => {
        await grantOrRevokeRole(HardhatRuntimeEnvironment, "MappingToken", taskArgs.token, taskArgs.role, taskArgs.addr, "grant");
    });

task("revokeTokenRole", "grantRole")
    .addParam("token", "role")
    .addParam("role", "role")
    .addParam("addr", "role address")
    .setAction(async (taskArgs, HardhatRuntimeEnvironment) => {
        await grantOrRevokeRole(HardhatRuntimeEnvironment, "MappingToken", taskArgs.token, taskArgs.role, taskArgs.addr, "revoke");
    });

task("mintToken", "mint token")
    .addParam("token", "token address")
    .addParam("to", "mint address ")
    .addParam("amount", "mint amount")
    .setAction(async (taskArgs, HardhatRuntimeEnvironment) => {
        let token = await attachToken(HardhatRuntimeEnvironment, "MappingToken", taskArgs.token);
        await (await token.mint(taskArgs.to, taskArgs.amount)).wait();
    });
task("setMintCap", "setMinterCap")
    .addParam("token", "token addr")
    .addParam("addr", "minter addr")
    .addParam("cap", "cap")
    .setAction(async (taskArgs, HardhatRuntimeEnvironment) => {
        let token = await attachToken(HardhatRuntimeEnvironment, "MappingToken", taskArgs.token);
        console.log("before: ", await token.getMinterCap(taskArgs.addr));
        await (await token.setMinterCap(taskArgs.addr, HardhatRuntimeEnvironment.ethers.utils.parseEther(taskArgs.cap))).wait();
        console.log("after : ", await token.getMinterCap(taskArgs.addr));
    });
