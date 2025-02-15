import { Router } from  "express";
import {Balades } from "./baladeModel.js"; 
import { isValidObjectId } from "mongoose";




const router = Router();

router.get('/', (req, rep) => {
    rep.json("Bonjour");
})

//Q1
router.get("/all", async function(req, rep){
    const reponse = await Balades.find({})
    rep.json(reponse);
})

//Q2
router.get("/id/:id", async function (req, rep){
    const id =req.params.id;

    const verif = isValidObjectId(id)

    if(!verif){
        return rep.status(400).json({msg : "id invalid"});
    }

    const reponse = await Balades.findById({_id : id})
    rep.json({reponse});
})

//Q3
router.get("/search/:search", async function (req, rep) {
    const searchTerm = req.params.search;
    const regex = new RegExp(searchTerm, 'i'); 
  
    try {
      const response = await Balades.find({
        $or: [
          { nom_poi: { $regex: regex } },
          { texte_intro: { $regex: regex } },
        ],
      });
      rep.json(response);
    } catch (error) {
      rep.status(500).json({ msg: "Server error" });
    }
});


//Q4
router.get("/site-internet", async function (req, rep) {
    const response = await Balades.find({ 
        url_site: { 
            $exists: true, 
            $ne: null  
        } 
    });
    rep.json(response);
})


//Q5
router.get("/mot-cle", async function(req, rep){
    const response = await Balades.find({ mot_cle: { $size: 5 } }); 
    rep.json(response);
})

//Q6
router.get("/publie/:annee", async function (req, rep) {
    const annee = req.params.annee;
    const regex = new RegExp(`^${annee}-`);
  
    const balades = await Balades.find({ 
        date_saisie: { $regex: regex } 
    }).sort({ 
        date_saisie: 1 
    });
    rep.json(balades);
});


//Q7
router.get("/arrondissement/:num_arrondissement", async function (req, rep) {
    const code_postal = req.params.num_arrondissement;
  
    const count = await Balades.countDocuments({ 
        code_postal: code_postal 
    });
    rep.json({ count: count });
   
});


//Q8
router.get("/synthese", async function (req, rep) {

    const result = await Balades.aggregate([
        {
          $group: {
            _id: "$code_postal",
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
    ]);
  
    rep.json(result);
});
  

//Q9
router.get("/categories", async function (req, rep) {
   
    const categories = await Balades.distinct("categorie");
    rep.json(categories);
});
  

//Q10
router.post("/add", async function (req, rep) {
    const newBalade = new Balades(req.body);
  
    if (!newBalade.nom_poi || !newBalade.adresse || !newBalade.categorie) {
      return rep.status(400).json({ msg: "Missing required fields" });
    }
  
    const result = await newBalade.save();
    rep.json(result);
   
});


//Q11
router.put("/add-mot-cle/:id", async function (req, rep) {
  const id = req.params.id;

  if (!isValidObjectId(id)) {
    return rep.status(400).json({ msg: "ID invalide" });
  }

  const balade = await Balades.findById(id);

  if (!balade) {
  return rep.status(404).json({ msg: "Balade non trouvée" });
  }

  const nouveauMotCle = req.body.mot_cle;

  if (balade.mot_cle.includes(nouveauMotCle)) {
  return rep.status(409).json({ msg: "Mot clé déjà présent" });
  }

  balade.mot_cle.push(nouveauMotCle);
  await balade.save();

  rep.status(200).json({ msg: "Mot clé ajouté avec succès" });

});

//Q12
router.put('/update-one/:id', async (req, res) => {
  try {
    const updatedBalade = await Balades.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updatedBalade) {
      return res.status(404).json({ message: 'Balade not found' });
    }
    res.status(200).json(updatedBalade);
  } catch (error) {
    console.log(error)
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid ID' });
    }
    res.status(500).json({ message: error.message });
  }
});

//Q13
router.put('/update-many/:search', async (req, res) => {
  const search = req.params.search;
  const newNomPoi = req.body.nom_poi;

  if (!newNomPoi) {
    return res.status(400).json({ message: 'New nom_poi is required' });
  }

  try {
    const result = await Balades.updateMany(
      { texte_description: { $regex: search, $options: 'i' } },
      { $set: { nom_poi: newNomPoi } }
    );

    if (result.nModified === 0) {
      return res.status(404).json({ message: 'No balades matched the search criteria' });
    }

    res.status(200).json({ message: ` balades updated successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


//Q14
router.delete('/delete/:id', async (req, res) => {
  try {
    const deletedBalade = await Balades.findByIdAndDelete(req.params.id);
    if (!deletedBalade) {
      return res.status(404).json({ message: 'Balade not found' });
    }
    res.status(200).json({ message: 'Balade deleted successfully' });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid ID' });
    }
    res.status(500).json({ message: error.message });
  }
});

export default router ;

 