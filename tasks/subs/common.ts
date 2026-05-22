import { ethers } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";

export const DEFAULT_DEPLOY_FACTORY = "0x6258e4d2950757A749a4d4683A7342261ce12471";

const DEPLOY_FACTORY_ABI = [
    "function deploy(bytes32 salt, bytes memory creationCode, uint256 value) external",
    "function getAddress(bytes32 salt) external view returns (address)",
];

type DeployTaskArgs = {
    name: string;
    symbol: string;
    decimals: number;
    admin: string;
};

type DeployWithFactoryTaskArgs = DeployTaskArgs & {
    salt: string;
    factory: string;
};

export async function getDeployer(hre: HardhatRuntimeEnvironment): Promise<string> {
    const { deployer } = await hre.getNamedAccounts();
    console.log("deployer:", deployer);
    return deployer;
}

export function resolveAdmin(admin: string, deployer: string): string {
    return admin === "" ? deployer : admin;
}

export function resolveRole(role: string): string {
    if (role === "DEFAULT_ADMIN_ROLE") {
        return ethers.constants.HashZero;
    }

    return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(role));
}

export function ensureRoleAllowed(role: string, allowedRoles: string[]): void {
    if (!allowedRoles.includes(role)) {
        throw new Error(`unsupported role: ${role}, allowed roles: ${allowedRoles.join(", ")}`);
    }
}

export async function attachToken(
    hre: HardhatRuntimeEnvironment,
    contractName: string,
    tokenAddress: string
) {
    await getDeployer(hre);
    const Token = await hre.ethers.getContractFactory(contractName);
    return Token.attach(tokenAddress);
}

export async function deployToken(
    hre: HardhatRuntimeEnvironment,
    contractName: string,
    taskArgs: DeployTaskArgs
): Promise<string> {
    const deployer = await getDeployer(hre);
    const admin = resolveAdmin(taskArgs.admin, deployer);

    await hre.deployments.deploy(contractName, {
        from: deployer,
        args: [taskArgs.name, taskArgs.symbol, taskArgs.decimals, admin],
        log: true,
        contract: contractName,
    });

    const token = await hre.deployments.get(contractName);
    console.log("token admin :", admin);
    console.log("token ==", token.address);
    return token.address;
}

export async function deployTokenWithFactory(
    hre: HardhatRuntimeEnvironment,
    contractName: string,
    taskArgs: DeployWithFactoryTaskArgs
): Promise<string> {
    const deployer = await getDeployer(hre);
    const admin = resolveAdmin(taskArgs.admin, deployer);

    console.log("token admin :", admin);

    const factory = await hre.ethers.getContractAt(DEPLOY_FACTORY_ABI, taskArgs.factory);
    const saltHash = hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes(taskArgs.salt));
    console.log("deploy factory address:", factory.address);
    console.log("deploy salt:", taskArgs.salt);

    const addr = await factory.getAddress(saltHash);
    console.log("deployed to :", addr);

    const code = await hre.ethers.provider.getCode(addr);
    if (code !== "0x") {
        console.log("token already deployed", addr);
        return addr;
    }

    const param = hre.ethers.utils.defaultAbiCoder.encode(
        ["string", "string", "uint8", "address"],
        [taskArgs.name, taskArgs.symbol, taskArgs.decimals, admin]
    );

    const Token = await hre.ethers.getContractFactory(contractName);
    const createCode = hre.ethers.utils.solidityPack(["bytes", "bytes"], [Token.bytecode, param]);
    const receipt = await (await factory.deploy(saltHash, createCode, 0)).wait();
    if (receipt.status !== 1) {
        throw new Error("deploy fail");
    }

    console.log("deployed to :", addr);
    return addr;
}

export async function grantOrRevokeRole(
    hre: HardhatRuntimeEnvironment,
    contractName: string,
    tokenAddress: string,
    roleName: string,
    account: string,
    action: "grant" | "revoke"
): Promise<void> {
    const token = await attachToken(hre, contractName, tokenAddress);
    const role = resolveRole(roleName);

    if (action === "grant") {
        await (await token.grantRole(role, account)).wait();
        return;
    }

    await (await token.revokeRole(role, account)).wait();
}
