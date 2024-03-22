# mapping-token-contracts


## deploy
```
npx hardhat deployMappingToken --name <name> --symbol <symbol> --network <network>
```


## setMinterCap

```
npx hardhat setMinterCap --token <token> --cap <cap>  --network <network>
```



## grantTokenRole

role: 'MANAGER_ROLE' , 'MINTER_ROLE','DEFAULT_ADMIN_ROLE'

```
npx hardhat grantTokenRole --token <token> --role <role> --addr <addr> --network <network>
```


## revokeTokenRole

```
npx hardhat revokeTokenRole --token <token> --role <role> --addr <addr> --network <network>
```

