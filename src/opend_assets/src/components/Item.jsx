import React, { useEffect ,useState} from "react";
import logo from "../../assets/logo.png";
import {Actor , HttpAgent} from "@dfinity/agent";
import { idlFactory } from "../../../declarations/nft";
import {Principal} from "@dfinity/principal";
import Button from "./Button";
import { opend } from "../../../declarations/opend";
import CURRENT_USER_ID from "../index";
import PriceLabel from "./PriceLabel";

import { idlFactory as tokenIdlFactory } from "../../../declarations/token";


function Item(props) {

  const [name,setName]=useState();  //name of the NFT Hook
  const [owner,setOwner]=useState();  //NFT Owner adress
  const [asset,setAsset]=useState();  //NFT Content

  const [button,setButton]=useState();  //Button
  const [priceInput,setPriceInput]=useState();  //Button
  const [loaderHidden,setLoaderHidden]=useState(true);  //Loader
  const [blur,setBlur]=useState();
  const [sellStatus, setSellStatus]= useState("");
  const [priceLabel,setPriceLabel]=useState();
  const [shouldDisplay,setDisplay]=useState(true);







  const id = /*Principal.fromText*/ ( props.id);
  const localHost= "http://localhost:8080/";
  const agent = new HttpAgent ({host: localHost});
 
  //When deploying live in IC remove the following key > agent.fetchRootKey();
  agent.fetchRootKey();


  let NFTActor;


  async function loadNft(){
      NFTActor= await Actor.createActor(idlFactory,{
      agent,
      canisterId:id     
    } );


    const name = await NFTActor.getName();
    const owner = await NFTActor.getNftOwner();
    const asset =await NFTActor.getImageBytes();
    const assetContent = new Uint8Array(asset);                                      // convert the bytes array into an NFT image
    const image= URL.createObjectURL(new Blob ([assetContent.buffer],{type:"image/png"})); 
    setName(name);    
    setOwner(owner.toText());
    setAsset(image)

    if (props.role == "collections"){

          const nftIsListed= await opend.isListed((props.id))
          if (nftIsListed){
            setOwner("openD");
            setBlur({filter: "blur(4px"});
            setSellStatus("Listed")
          }else{
            setButton(<Button handleClick={handleSell} text="Sell"/>);
          }

    } else if (props.role == "discover") {

      const originalOwner = await opend.getOriginalOwner(props.id);

      if (originalOwner.toText() != CURRENT_USER_ID.toText()){

        setButton(<Button handleClick={handleBuy} text="Buy"/>);

      }

      const price= await opend.getListedNFTPrice (props.id);
      setPriceLabel(<PriceLabel  sellPrice={price.toString()}/>);


      
    }
  };



  async function handleBuy(){

    console.log("Buy was triggered")
    setLoaderHidden(false);

    const tokenActor= await Actor.createActor(tokenIdlFactory  , {
      agent,
      canisterId: Principal.fromText("tfuft-aqaaa-aaaaa-aaaoq-cai")
    })

    const sellerId = await opend.getOriginalOwner(props.id);
    const itemPrice= await opend.getListedNFTPrice(props.id);

    const result= await tokenActor.transfer(sellerId,itemPrice); 
    console.log(result);

    if (result=="Success!"){
      //Transfer the ownership
      const transferResult= await opend.completePurshase(props.id ,sellerId , CURRENT_USER_ID);
      console.log("Purshase: "+ transferResult)

      setLoaderHidden(true)
      setDisplay(false)

    }




  };




  useEffect(() => {
    loadNft();
  },[]
  );
  
  function handleSell(){

    console.log("Clicked")
    let price;
    setPriceInput(

      <input
        placeholder="Price in IZN"
        type="number"
        className="price-input"
        value={price}
        onChange={(e=>{price=(e.target.value)})}
      />);

      setButton(<Button handleClick={sellItem} text="Confirm"/>)

  async function sellItem() {

    setBlur({filter: "blur(4px"});
    setLoaderHidden(false) 

    console.log("Confirm clicked");
    const listingResult= await opend.listItemId(id, Number(price));
    console.log(listingResult)

    if (listingResult=="Success!"){

      const opendID= await opend.getOpenDCanisterID();
      const transferResult= await NFTActor.transferOwnership(opendID);

      console.log("transfer: " + transferResult);

      if (transferResult==("Success!")){
        setLoaderHidden(true)};
        setButton();
        setPriceInput();
        setOwner("OpenD")
        setSellStatus("Listed")
        
    };        
    };  
  };
  
  return (
    <div style={{display : shouldDisplay? "inline":  "none"}} className="disGrid-item">
      <div className="disPaper-root disCard-root makeStyles-root-17 disPaper-elevation1 disPaper-rounded">
        <img
          className="disCardMedia-root makeStyles-image-19 disCardMedia-media disCardMedia-img"
          src={asset}
          style={blur}
          
        />e

        <div className="lds-ellipsis" hidden={loaderHidden}>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
        <div className="disCardContent-root">

          {priceLabel}
          <h2 className="disTypography-root makeStyles-bodyText-24 disTypography-h5 disTypography-gutterBottom">
            {name}<span className="purple-text"> {sellStatus}</span>
          </h2>
          <p className="disTypography-root makeStyles-bodyText-24 disTypography-body2 disTypography-colorTextSecondary">
            Owner: {owner}
          </p>
          {priceInput}
          {button}
        </div>
      </div>
    </div>
  );
}

export default Item;
