import { useEffect, useState } from 'react';
import { useMoralis } from 'react-moralis';
const useInchDex = (chain: any) => {
  const { Moralis, account, isInitialized } = useMoralis();
  const [tokenList, setTokenlist] = useState<object>();
  console.log('token list inside the hook', tokenList);
  console.log('chain inside hook', chain);
  console.log('isInitialized', isInitialized);
  console.log('moralis plugin', Moralis.Plugins['oneInch']);
  useEffect(() => {
    if (!Moralis.Plugins['oneInch']) {
      console.log(Moralis.Plugins['oneInch']);
      console.log('what is wrong');
      return;
    }
    Moralis.Plugins['oneInch']
      .getSupportedTokens({ chain })
      .then((tokens: { tokens: object }) => {
        console.log('Tokens from plugin', tokens.tokens);
        setTokenlist(tokens.tokens);
      });
  }, [Moralis, Moralis.Plugins, chain]);

  const getQuote = async (params: any) =>
    await Moralis.Plugins['oneInch'].quote({
      chain: params.chain, // The blockchain  you want to use (eth/bsc/polygon)
      fromTokenAddress: params.fromToken.address, // The token you want to swap
      toTokenAddress: params.toToken.address, // The token you want to receive
      amount: Moralis.Units.Token(
        params.fromAmount,
        params.fromToken.decimals
      ).toString(),
    });

  async function trySwap(params: any) {
    const { fromToken, fromAmount, chain } = params;
    const amount = Moralis.Units.Token(
      fromAmount,
      fromToken.decimals
    ).toString();
    if (fromToken.address !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
      await Moralis.Plugins['oneInch']
        .hasAllowance({
          chain, // The blockchain you want to use (eth/bsc/polygon)
          fromTokenAddress: fromToken.address, // The token you want to swap
          fromAddress: account, // Your wallet address
          amount,
        })
        .then(async (allowance: any) => {
          console.log(allowance);
          if (!allowance) {
            await Moralis.Plugins['oneInch'].approve({
              chain, // The blockchain you want to use (eth/bsc/polygon)
              tokenAddress: fromToken.address, // The token you want to swap
              fromAddress: account, // Your wallet address
            });
          }
        })
        .catch((e: { message: any }) => alert(e.message));
    }

    await doSwap(params)
      .then((receipt) => {
        if (receipt.statusCode !== 400) {
          alert('Swap Complete');
        }
        console.log(receipt);
      })
      .catch((e) => alert(e.message));
  }

  async function doSwap(params: any) {
    return await Moralis.Plugins['oneInch'].swap({
      chain: params.chain, // The blockchain you want to use (eth/bsc/polygon)
      fromTokenAddress: params.fromToken.address, // The token you want to swap
      toTokenAddress: params.toToken.address, // The token you want to receive
      amount: Moralis.Units.Token(
        params.fromAmount,
        params.fromToken.decimals
      ).toString(),
      fromAddress: account, // Your wallet address
      slippage: 1,
    });
  }

  return { getQuote, trySwap, tokenList };
};

export default useInchDex;
