import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
    attachToken,
    DEFAULT_DEPLOY_FACTORY,
    deployToken,
    deployTokenWithFactory,
    ensureRoleAllowed,
    grantOrRevokeRole,
} from "./common";

const MAPPING_TOKEN_V2_ROLES = ["PAUSER_ROLE", "DEFAULT_ADMIN_ROLE"];

task("deployMappingTokenV2", "deploy MappingTokenV2")
    .addParam("name", "token name")
    .addParam("symbol", "token symbol")
    .addOptionalParam("decimals", "decimals, default is 18", 18, types.int)
    .addParam("admin", "admin address, should be multisig")
    .addFlag("verify", "verify the contract on Etherscan after deploy")
    .setAction(async (taskArgs, HardhatRuntimeEnvironment) => {
        const addr = await deployToken(HardhatRuntimeEnvironment, "MappingTokenV2", taskArgs);
        if (taskArgs.verify) {
            try {
                await HardhatRuntimeEnvironment.run("verify:verify", {
                    address: addr,
                    constructorArguments: [taskArgs.name, taskArgs.symbol, taskArgs.decimals, taskArgs.admin],
                });
            } catch (e: any) {
                console.warn("verify failed:", e.message || e);
            }
        }
    });

task("deployMappingTokenV2WithFactory", "deploy MappingTokenV2 with factory")
    .addParam("name", "token name")
    .addParam("symbol", "token symbol")
    .addParam("salt", "deploy salt")
    .addOptionalParam("decimals", "decimals, default is 18", 18, types.int)
    .addParam("admin", "admin address, should be multisig")
    .addOptionalParam(
        "factory",
        "deploy factory address, default is 0x6258e4d2950757A749a4d4683A7342261ce12471",
        DEFAULT_DEPLOY_FACTORY
    )
    .addFlag("verify", "verify the contract on Etherscan after deploy")
    .setAction(async (taskArgs, HardhatRuntimeEnvironment) => {
        const addr = await deployTokenWithFactory(HardhatRuntimeEnvironment, "MappingTokenV2", taskArgs);
        if (taskArgs.verify) {
            try {
                await HardhatRuntimeEnvironment.run("verify:verify", {
                    address: addr,
                    constructorArguments: [taskArgs.name, taskArgs.symbol, taskArgs.decimals, taskArgs.admin],
                });
            } catch (e: any) {
                console.warn("verify failed:", e.message || e);
            }
        }
    });

task("grantTokenV2Role", "grant MappingTokenV2 role")
    .addParam("token", "token address")
    .addParam("role", "role")
    .addParam("addr", "role address")
    .setAction(async (taskArgs, HardhatRuntimeEnvironment) => {
        ensureRoleAllowed(taskArgs.role, MAPPING_TOKEN_V2_ROLES);
        await grantOrRevokeRole(HardhatRuntimeEnvironment, "MappingTokenV2", taskArgs.token, taskArgs.role, taskArgs.addr, "grant");
    });

task("revokeTokenV2Role", "revoke MappingTokenV2 role")
    .addParam("token", "token address")
    .addParam("role", "role")
    .addParam("addr", "role address")
    .setAction(async (taskArgs, HardhatRuntimeEnvironment) => {
        ensureRoleAllowed(taskArgs.role, MAPPING_TOKEN_V2_ROLES);
        await grantOrRevokeRole(HardhatRuntimeEnvironment, "MappingTokenV2", taskArgs.token, taskArgs.role, taskArgs.addr, "revoke");
    });

task("mintTokenV2", "mint MappingTokenV2")
    .addParam("token", "token address")
    .addParam("to", "mint address")
    .addParam("amount", "mint amount, in human units (scaled by token decimals)")
    .setAction(async (taskArgs, HardhatRuntimeEnvironment) => {
        const token = await attachToken(HardhatRuntimeEnvironment, "MappingTokenV2", taskArgs.token);
        const decimals = await token.decimals();
        const amount = HardhatRuntimeEnvironment.ethers.utils.parseUnits(taskArgs.amount, decimals);
        await (await token.mint(taskArgs.to, amount)).wait();
        console.log("minted:", taskArgs.amount, "to", taskArgs.to);
    });

task("setMinterV2", "set MappingTokenV2 minter")
    .addParam("token", "token address")
    .addParam("addr", "minter address")
    .setAction(async (taskArgs, HardhatRuntimeEnvironment) => {
        const token = await attachToken(HardhatRuntimeEnvironment, "MappingTokenV2", taskArgs.token);
        console.log("before: ", await token.minter());
        await (await token.setMinter(taskArgs.addr)).wait();
        console.log("after : ", await token.minter());
    });

task("setMintCapV2", "set MappingTokenV2 mint cap")
    .addParam("token", "token address")
    .addParam("cap", "cap")
    .setAction(async (taskArgs, HardhatRuntimeEnvironment) => {
        const token = await attachToken(HardhatRuntimeEnvironment, "MappingTokenV2", taskArgs.token);
        const decimals = await token.decimals();
        console.log("before: ", await token.mintCap());
        await (await token.setMintCap(HardhatRuntimeEnvironment.ethers.utils.parseUnits(taskArgs.cap, decimals))).wait();
        console.log("after : ", await token.mintCap());
    });
