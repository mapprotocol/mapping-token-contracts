# mapping-token-contracts

## MappingToken V1

### Deploy
```bash
npx hardhat deployMappingToken --name <name> --symbol <symbol> --network <network>
```

### Deploy With Factory
```bash
npx hardhat deployMappingTokenWithFactory --name <name> --symbol <symbol> --salt <salt> --network <network>
```

### Mint
```bash
npx hardhat mintToken --token <token> --to <to> --amount <amount> --network <network>
```

### Set Mint Cap
```bash
npx hardhat setMintCap --token <token> --addr <minter> --cap <cap> --network <network>
```

### Grant Role
role: `MANAGER_ROLE`, `MINTER_ROLE`, `DEFAULT_ADMIN_ROLE`

```bash
npx hardhat grantTokenRole --token <token> --role <role> --addr <addr> --network <network>
```

### Revoke Role
```bash
npx hardhat revokeTokenRole --token <token> --role <role> --addr <addr> --network <network>
```

## MappingToken V2

### Deploy
```bash
npx hardhat deployMappingTokenV2 --name <name> --symbol <symbol> --admin <admin> --network <network>
```

### Deploy With Factory
```bash
npx hardhat deployMappingTokenV2WithFactory --name <name> --symbol <symbol> --salt <salt> --admin <admin> --network <network>
```

### Mint
```bash
npx hardhat mintTokenV2 --token <token> --to <to> --amount <amount> --network <network>
```

### Set Minter
```bash
npx hardhat setMinterV2 --token <token> --addr <minter> --network <network>
```

### Set Mint Cap
```bash
npx hardhat setMintCapV2 --token <token> --cap <cap> --network <network>
```

### Grant Role
role: `PAUSER_ROLE`, `DEFAULT_ADMIN_ROLE`

```bash
npx hardhat grantTokenV2Role --token <token> --role <role> --addr <addr> --network <network>
```

### Revoke Role
```bash
npx hardhat revokeTokenV2Role --token <token> --role <role> --addr <addr> --network <network>
```
