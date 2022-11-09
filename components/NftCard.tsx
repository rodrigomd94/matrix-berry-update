
import { useState } from 'react'
import { useStoreActions, useStoreState } from "../utils/store";


const NftCard = (props: any) => {
    const image = typeof (props.meta.image) === 'string' ? "https://ipfs.io/ipfs/" + props.meta.image.replace("ipfs://", "") : ""
    const [isEditing, setIsEditing] = useState<boolean>(false)
    const [description, setDescription] = useState<string>(props.meta.description)

    const updateDescription = async()=>{
        setIsEditing(!isEditing)
        const txHash = await props.update(props.refUnit, description)
        console.log(txHash)
    }

/*     const edit = ()=>{
        if(isEditing){
            
        }else{

        }
    } */
    return (
        <>
            <div className="card bg-neutral bg-base-400 shadow-xl mt-5">
                <figure className="px-10 pt-10">
                    <img src={image} alt="Shoes" className="rounded-xl" />
                </figure>
                <div className="card-body items-center text-center">
                    <h2 className="card-title">{props.meta.name}</h2>
                    <p style={{display:isEditing? "none":"block"}} >{description}</p>
                    <textarea style={{display: isEditing?"block":"none"}} className="textarea textarea-bordered" value={description} onChange={(e)=>{setDescription(e.target.value)}}></textarea>
                    <div className="card-actions">
                        <button style={{display: isEditing?"none":"block"}} className='btn btn-primary btn-xs'onClick={()=>{setIsEditing(!isEditing)}} >Edit description</button>
                        <button style={{display: isEditing?"block":"none"}} className='btn btn-accent btn-xs'onClick={()=>{updateDescription()}} >Update</button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default NftCard;