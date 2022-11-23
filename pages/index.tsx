import type { NextPage } from 'next'
import Head from 'next/head'
import WalletConnect from '../components/WalletConnect'
import { useStoreActions, useStoreState } from "../utils/store"
import Link from 'next/link'
import { useState, useEffect } from 'react'
import NftGrid from "../components/NftGrid";
import MessageModal from '../components/MessageModal'
import LoadingModal from '../components/LoadingModal'
import initLucid from '../utils/lucid'
import scripts from '../utils/scripts.json';
import { Constr, Data, Json, Lucid, PlutusData, toUnit, TxHash, applyParamsToScript, toLabel, SpendingValidator } from 'lucid-cardano'

const Home: NextPage = () => {
  const walletStore = useStoreState((state: any) => state.wallet)
  const [displayMessage, setDisplayMessage] = useState<{ title: string, message: string }>({ title: "", message: "" })
  const [showModal, setShowModal] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [lucid, setLucid] = useState<Lucid>()
  const [allBerries, setAllBerries] = useState<any[]>([])

  const referenceAddress = "addr1wxvh8yhqcmnza05zq2lq0za7tx5j2nnayzge9mvew97w42g9hzfeg"
  const berryPolicy = "01cecfaeda9d846c08675902b55a6371f593d9239744867462c5382e"

  const spendReference: SpendingValidator = {
    type: "PlutusV2",
    script: applyParamsToScript(
      scripts.spendReference,
      new Constr(0, [toLabel(100), toLabel(222)]),
    ),
  };

  useEffect(() => {
    if (walletStore.name != "") {
      setShowModal(false)
      initLucid(walletStore.name).then((Lucid: Lucid) => { setLucid(Lucid) })
    } else {
      setLoading(false)
      //getBerries("addr1qxc4fjuz0xvcqe7h72haf4dwp9alghxgukp2n3m7s4jl83yt75mupl0fwl5a8nwjj084wlea4srs3jp4xvgmlnzyskfq8jn6rz")
      //console.log("loaded")
      // console.log(lucid!.utxosAt("addr1qxc4fjuz0xvcqe7h72haf4dwp9alghxgukp2n3m7s4jl83yt75mupl0fwl5a8nwjj084wlea4srs3jp4xvgmlnzyskfq8jn6rz"))
      //.then(data=>{console.log(data)})
      setDisplayMessage({ title: "Not connected", message: "Close this modal and connect your wallet." })
      setShowModal(true)
    }
  }, [walletStore.name, walletStore.address])

  useEffect(() => {
    if (lucid && walletStore.address) {
      const addr = walletStore.address
     // const addr = "addr1q80z6se4x0hnxczyw7psscmlhq2zegxdjp70d2r05muk7u3u530vfvhy4en46832ld3zahkzm3l2ct0uu7txa7gtwukqmgkgva" //addr for testing
      getBerries(addr)
        .then(data => { 
          setAllBerries(data)
          if(data.length===0){
            setDisplayMessage({title:"Sad", message: "You dont't own any Matrix berries."})
            setShowModal(true)
          }
        })
    } else if(walletStore.address=="") {
      setLoading(false)
      setDisplayMessage({ title: "Not connected", message: "Close this modal and connect your wallet." })
      setShowModal(true)
      // initLucid(walletStore.name).then((Lucid: Lucid) => { setLucid(Lucid) })
    }else{
      setLoading(false)
    }
  }, [lucid])

  const getBerries = async (address: string) => {
    const berries = []
    const utxos = await lucid!.utxosAt(address)
    for (let utxo of utxos) {
      for (let unit of Object.keys(utxo.assets)) {
        if (unit.startsWith(berryPolicy)) {
          const refUnit = unit.replace("000de1404d", "000643b04d")
          const metadata = await getMetadata(refUnit)
          berries.push({ refUnit, metadata })
        }
      }
    }
    return berries
  }
  const getMetadata = async (matrixAssetId: string): Promise<Json> => {
    console.log("getting meta")
    const [refNFTUtxo] = await lucid!.utxosAtWithUnit(
      referenceAddress,
      matrixAssetId,
    );
    if (!refNFTUtxo) return {};

    const metadataDatum = Data.from(await lucid!.datumOf(refNFTUtxo)) as Constr<
      PlutusData
    >;

    const metadata: {
      name: string;
      image: string;
      id: number;
      description: string;
    } = Data
      .toJson(metadataDatum.fields[0]);
    console.log(metadata)
    return metadata;
  };

  const updateDescription = async (
    matrixRefAssetId: string,
    description: string,
  ): Promise<TxHash> => {

    const [refNFTUtxo] = await lucid!.utxosAtWithUnit(
      referenceAddress,
      matrixRefAssetId,
    );

    const userTokenUtxo = (await lucid!.wallet.getUtxos()).find((utxo) =>
      !!utxo.assets[matrixRefAssetId.replace("000643b04d", "000de1404d")]
    );

    if (!refNFTUtxo) throw new Error("NoUTxOError");
    if (!userTokenUtxo) throw new Error("NoOwnershipUTxOError");

    const metadataDatum = Data.from(await lucid!.datumOf(refNFTUtxo)) as Constr<
      PlutusData
    >;

    const metadata: {
      name: string;
      image: string;
      id: number;
      description: string;
    } = Data
      .toJson(metadataDatum.fields[0]);

    metadata.description = description;

    metadataDatum.fields[0] = Data.fromJson(metadata);

    const tx = await lucid!.newTx().collectFrom(
      [refNFTUtxo],
      Data.to(new Constr(1, [])),
    ).collectFrom([userTokenUtxo]).payToContract(
      referenceAddress,
      Data.to(metadataDatum),
      refNFTUtxo.assets,
    )
      .attachSpendingValidator(spendReference)
      .complete();
    const signedTx = await tx.sign().complete();
    const txHash = await signedTx.submit();
    setLoading(true)
    lucid!.awaitTx(txHash)
    setLoading(false)
    setDisplayMessage({title:"Transaction submited", message:txHash})
    setShowModal(true)
    return txHash;
  };

  return (
    <div className="px-10">
      <Head>
        <title>Matrix berry description update</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <MessageModal message={displayMessage.message} active={showModal} title={displayMessage.title} />
      <LoadingModal active={loading} />
      <div className="navbar bg-base-100">
        <div className="flex-1">
          <Link href="/" className="btn btn-ghost normal-case text-xl">Matrix Berries</Link>
        </div>
        <div className="flex-none">
          <WalletConnect />
        </div>
      </div>
      <div className="mx-40 my-10 text-center">
        <div><b>Address: </b>{walletStore.address}</div>
        <div className="text-accent text-bold text-xl mt-5" style={{visibility:allBerries.length===0 ? 'hidden' : 'visible'}}>Your Berries:</div>
        <NftGrid nfts={allBerries} update={updateDescription} />
      </div>
    </div>
  )
}

export default Home
