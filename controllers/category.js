/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
const Category = require("../models/category");


const {slug} = require("../utils");
const {
    errorHandler,
    //checkErrorFromDataBase
} = require("../helpers/dbErrorHandler");
const { validationResult } = require("express-validator");

// creation
exports.create = async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const firstError = errors.array()[0].msg;
        return res.status(400).json({ error: firstError });
    }

    // je réccupere les fields et on verifie l'existence de slug dans les fields
    // si un slug n'as pas été défini alors générer un slugs localmment se basant sur le nom
  
    let formatedBody = {
        ...req.body,
        slug: req.body.slug !== undefined ? req.body.slug : slug(req.body.name),
        // set empty parent
        parent:(req.body.parent==="" || req.body.parent==="") ? undefined : req.body.parent
    };

    // fonction de sauvegarde
    const save = data => {
        let category = new Category(data);
        category.save((err, category) => {
            if (err) {
                return res.status(400).json({
                    error: errorHandler(err)
                });
            }
            res.json({ category });
        });
    };

    // j'appelle cette fonction pour configurer les path et èxécuter a la fin la fonction save
    // je passe en paramèttre res pour retourner une erreur si il le faut dans le processus de génération de path
    configPath(formatedBody, save, res);
};

exports.categoryById = (req, res, next, id) => {
    Category.findById(id).exec((err, category) => {
        if (err | !category) {
            return res.status(400).json({
                error: "Category not found"
            });
        }
        req.category = category;
        next();
    });
};

exports.read = (req, res) => {
    return res.json({ category: req.category });
};

exports.update = (req, res) => {
    // je stock l'ancien path, pour vérifier si il sera modifier plus tard
    // si il est modifier, je change tout les path des éléments enfants a la catégorie courant
    const oldFullpath = req.category.fullPath;

    const save = formatedData => {
        const category = req.category;
        Object.keys(formatedData).map(function(key, index) {
            category[key] = formatedData[key];
        });

        category.save((err, data) => {
            if (err) {
                return res.status(400).json({
                    error: errorHandler(err)
                });
            }

            console.log("changement de path");

            if (oldFullpath !== data.fullPath) {
                console.log("changement de path");
            }

            res.json({ data });
        });

    // console.log("changement");
    };

    // je creé un parent pour l'élement courant
    //si  il n'y a pas de parent défini dans le fields alors prendre son acien parent
    // si il n'y avait pas un ancien parent valide alors mettre la valeur undefined
    const parent =
    req.body.parent !== undefined
        ? req.body.parent
        : req.category.parent !== undefined
            ? req.category.parent
            : undefined;

    // je fais le traitement précédent au slug
    const slug =
    req.body.slug !== undefined
        ? req.body.slug
        : req.category.slug !== undefined
            ? req.category.slug
            : slug(req.body.name);

    // je reformate la nouvelle catégories, à partir des données fields et du parent et slug traiter
    const formatData = { ...req.body, parent, slug };
    configPath(formatData, save, res);
};

exports.remove = (req, res) => {
    const category = req.category;
    category.remove((err, data) => {
        if (err) {
            return res.status(400).json({
                error: errorHandler(err)
            });
        }
        res.json({
            message: "category deleted successfully"
        });
    });
};

exports.list = (req, res) => {
    Category.find()
        .populate("parent")
        .exec((err, categories) => {
            if (err) {
                return res.status(400).json({
                    error: errorHandler(err)
                });
            }
            res.json({
                categories
            });
        });
};

exports.hierarchicalList = async (req, res) => {
    var findChild = async cat => {
        await new Promise((resolve, reject) => {
            Category.find({ path: cat.fullPath }).exec(async (err, categories) => {
                if (err) {
                    return res.status(400).json({
                        error: errorHandler(err)
                    });
                }
                // console.log(" *** Nouveau noeud", cat)

        

                if (categories.length > 0) {
                    // console.log(" *** Parcourts des noeu de ", cat)
                    for (let index = 0; index < categories.length; index++) {
                        // console.log("----", cat.fullPath, index);
                        const element = await findChild(categories[index]);
                        // console.log("++++++++++> "+ cat.fullPath , element)
                        categories[index] = { ...element };
                    }

                    //     console.log("======> out boucle élément traiter ",{ ...cat._doc, child: [...categories] })
                    resolve({ ...cat._doc, child: [...categories] });
                } else {
                    //  console.log("....> Single", cat)
                    resolve({ ...cat });
                }
            });
        }).then(value => {
            //console.log("ooooo", value);
            //console.log("---------------> then",value._doc!==undefined? value._doc: value)
            cat = value._doc !== undefined ? value._doc : value;
        });
        // console.log("mmm",cat)
        return cat;
    };

    let cate = req.category;
    cate = await findChild(cate);
    res.json({
        categories: cate
    });
};


exports.fullContaint=(req,res)=>{
    // Category.find({path:req.category.fullPath})
    //     .exec((err, categories) => {
    //         if (err) {
    //             return res.status(400).json({
    //                 error: errorHandler(err)
    //             });
    //         }
    //         contains={subCategories:[...categories]};
    //         res.json({
    //             contains
    //         });

    //     });
};




// fonction pour generer les path
const configPath = (data, save, res) => {
    let formatedBody = { ...data };

    // si l'élecment courant à de parent alors reccuperer son fullpath et le spécifier comme
    //le path de la catégorie courrante
    // spécifier le fullpath= le fullpath du parent + le slug courrant
    if (formatedBody.parent) {
        Category.findById(formatedBody.parent).exec((err, parent) => {
            if (err | !parent) {
                return res.status(400).json({
                    error: "Le parent définit n'existe pas"
                });
            }

            formatedBody = {
                ...formatedBody,
                path: parent.fullPath,
                fullPath: parent.fullPath + "/" + formatedBody.slug
            };
            // console.log(formatedBody.slug)
            save(formatedBody);
        });
    } else {
    // si il n'y a pas de parent courant alors mettre just le slug comme fullpath
        formatedBody = { ...formatedBody, fullPath: formatedBody.slug };
        save(formatedBody);
    }
};


// exports.hierarchicalList = async (req, res) => {
//   var findChild = async cat => {
//    await  new Promise( (resolve, callback) => {
//       Category.find({ path: cat.fullPath })
//         .exec((err, categories) => {
//           if (err) {
//             return res.status(400).json({
//               err: errorHandler(err)
//             });
//           }

//           console.log(cat.fullPath, categories.length);
//           if(categories.length > 0 ){
//            const m= async (ri)=>{
//             for (let index = 0; index < ri.length; index++) {
//               console.log("debut  boucle "+cat.fullPath+" "+index)
//               let element = ri[index];
//               ri[index]= await findChild(cate)
//               console.log("fin  boucle "+cat.fullPath+" "+index)
//             }
//            }
//            m(categories);
//            console.log("fin verification")
//           }

//           const cato = { ...cat, child: [...categories] };
//           resolve(cato);
//         });

//     }).then(val => {
//       cat={...val}
//       console.log(" Pre fin");
//     });

//     console.log("=======>fin")
//     return cat;
//   };

//   const cate = { fullPath: "papeterie/scolaire" };

//   const categories = await findChild(cate);

//   res.json({
//     categories
//   });

//   const render = cate => {};
// };
