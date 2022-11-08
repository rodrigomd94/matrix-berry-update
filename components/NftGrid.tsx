
import { useEffect } from 'react'
import NftCard from './NftCard'

const NftGrid = (props : any) => {
    useEffect(()=>{
console.log(props)
    },[props])
    return (
        <>
        <div className="grid grid-cols-4 gap-2">
                {props.nfts.map((nft : any, index : Number) => {
                    return <NftCard key={index} update={props.update} refUnit={nft.refUnit} meta={{...nft.metadata, description:"test"}} />
                })}
            </div>
        </>

    )
}

export default NftGrid;