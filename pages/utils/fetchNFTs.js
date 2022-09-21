require('dotenv').config()

const { ALCHEMY_API_KEY } = process.env

const getNFTs = async (owner, contractAddress, retryAttempt) => {
  if (retryAttempt === 5) {
    return
  }

  let data

  if (owner) {
    try {
      if (contractAddress) {
        const dataJson = await fetch(
          `https://eth-mainnet.g.alchemy.com/nft/v2/${ALCHEMY_API_KEY}/getNFTs?owner=${owner}&contractAddresses`
        )
        data = dataJson.json()
      } else {
        const dataJson = await fetch(
          `https://eth-mainnet.g.alchemy.com/nft/v2/${ALCHEMY_API_KEY}/getNFTs?owner=${owner}`
        )
        data = dataJson.json()
      }
    } catch (e) {
      getNFTs(owner, contractAddress, retryAttempt + 1)
    }
  }

  return data
}

const getNFTMetadata = async NFTs => {
  const NFTsMetadata = await Promise.allSettled(
    NFTs.map(async NFT => {
      const metadataJson = await fetch(
        `https://eth-mainnet.g.alchemy.com/nft/v2/${ALCHEMY_API_KEY}/getNFTMetadata?contractAddress=${NFT.contract.address}&tokenId=${NFT.id.tokenId}`
      )
      const metadata = metadataJson.json()

      let imageUrl
      if (metadata.media.gateway.length) {
        imageUrl = metadata.media.uri.gateway
      } else {
        imageUrl = 'https://via.placeholder.com/500'
      }

      return {
        id: NFT.id.tokenId,
        contractAddress: NFT.contract.address,
        image: imageUrl,
        title: metadata.metadata.name,
        description: metadata.metadata.description,
        attributes: metadata.metadata.attributes,
      }
    })
  )

  return NFTsMetadata
}

const fetchNFTs = async (owner, contractAddress, setNFTs) => {
  const data = await getNFTs(owner, contractAddress)

  if (data.ownedNfts.length) {
    const NFTs = await getNFTMetadata(data.ownedNfts)
    let fullfilledNFTs = NFTs.filter(NFT => NFT.status === 'fulfilled')
    setNFTs(fullfilledNFTs)
  } else {
    setNFTs(null)
  }
}

export { fetchNFTs }
