const url = `https://mainnet.helius-rpc.com/?api-key=ff3c6e4e-511d-4b13-9ed7-7beab8f250e5`

const getAssetsByCreator = async () => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'my-id',
      method: 'getAssetsByCreator',
      params: {
        creatorAddress: '2tURYHc9JqntFh14kRuoJNrwbenQSJ5fErAuDUUzpudr',
        onlyVerified: true,
        page: 1, // Starts at 1
        limit: 1000
      },
    }),
  });
  const { result } = await response.json();
  let holders = []
  for(const item of result.items){
     holders.push({nftid:item.id,owner:item.ownership.owner})
  }
  console.log(holders)
};
getAssetsByCreator(); 