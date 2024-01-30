import Principal "mo:base/Principal";
import NFTActorClass "../NFT/nft";
import Cycles "mo:base/ExperimentalCycles";
import Debug "mo:base/Debug";
import HashMap "mo:base/HashMap";
import List "mo:base/List";
import Nat "mo:base/Nat";
import Iter "mo:base/Iter";
import Text "mo:base/Text";






actor OpenD {


    private type Listing = {
        itemOwner: Principal;
        itemPrice: Nat;

    };

    var mapOfNFTs=HashMap.HashMap<Principal,NFTActorClass.NFT >(1,Principal.equal,Principal.hash);
    var mapOfOwners=HashMap.HashMap<Principal,List.List <Principal>>(1,Principal.equal,Principal.hash);
    var mapOfListings =HashMap.HashMap<Principal, Listing >(1,Principal.equal,Principal.hash);

    public shared(msg) func mint (imgData:[Nat8], name:Text) : async Principal{ //sharef func accessible and can collect the user executer of the func

        let owner: Principal = msg.caller;


        Debug.print(debug_show (Cycles.balance()));
        Cycles.add (100_500_000_000);

        let newNft= await NFTActorClass.NFT(name , owner, imgData);
        Debug.print(debug_show (Cycles.balance())); 

        let newNftPrincipal : Principal= await newNft.getCanisterId();

        mapOfNFTs.put(newNftPrincipal,newNft);
        addToOwnershipMap(owner, newNftPrincipal);

        return newNftPrincipal;

    };

    private func addToOwnershipMap (owner:Principal ,nftId:Principal){

        var ownedNfts : List.List<Principal> = switch (mapOfOwners.get(owner)){

            case null List.nil <Principal>(); 
            case (?result) result;    
            
        };

        ownedNfts := List.push(nftId , ownedNfts);
        mapOfOwners.put(owner, ownedNfts);
    };


    public query func getOwnerNFTs(user:Principal): async [Principal]{

        var userNFTs : List.List<Principal> = switch(mapOfOwners.get(user)) {
            case(null) {List.nil<Principal>()};
            case(?result) { result};
        };

        return List.toArray (userNFTs)};

    public query func getListedNFTs() : async [Principal]{

        let ids = Iter.toArray(mapOfListings.keys());
        return ids;

    };


    public shared(msg) func listItemId(id: Principal , price:Nat) : async Text {


        var item :NFTActorClass.NFT= switch(mapOfNFTs.get(id)) {
            case(null) { return ("NFT does not exist")  };
            case(?result){result};
            };

            

        let owner= await item. getNftOwner();
        if(Principal.equal(owner,msg.caller)){

            let newListing:Listing ={
                itemOwner = owner ;
                itemPrice =price;

                // You can keep up with other variables as the historical price, historical owners etc..

            };mapOfListings.put(id,newListing);
            return("Success!");}           
        else{
            return ("You don´t own the NFT")
        };};

    
    public query func getOpenDCanisterID(): async Principal {
        return Principal.fromActor(OpenD)
    }; 

    public query func isListed (id:Principal):async Bool{

        if (mapOfListings.get(id)==null){
            return false
        }else{  return true};
    };

    public query func getOriginalOwner (id: Principal): async Principal {
        var listing : Listing = switch (mapOfListings.get(id)){
            case null return Principal.fromText("");
            case (?result) result;
        };

        return listing.itemOwner;
    };

    public query func getListedNFTPrice (id : Principal) : async Nat{
            var listing : Listing =  switch (mapOfListings.get(id)){
                case null return 0;
                case (?result) result;
                
            };
            return listing.itemPrice; 
    };

    public shared(msg) func completePurshase(id:Principal, ownerId: Principal, newOwnerId : Principal): async Text {

        //Transfer Ownership

        var purshasedNFT : NFTActorClass.NFT = switch (mapOfNFTs.get(id)){

            case null return "NFT does not exist";
            case (?result)  result;
        };

        let transferResult = await purshasedNFT.transferOwnership(newOwnerId);

        if (transferResult=="Success!"){
            mapOfListings.delete(id);
            var ownedNFTs : List.List<Principal> = switch (mapOfOwners.get(ownerId)){

                case null List.nil<Principal>();
                case(?result) result;

            };
            ownedNFTs := List.filter(ownedNFTs, func (listItemId: Principal) : Bool {
                return listItemId != id;
            });
            
            addToOwnershipMap (newOwnerId, id);
            return ("Success");
        } else {

            return "Error";
        }



        

    };
};
