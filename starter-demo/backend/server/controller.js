import { User, Product, Store, Favorites, SocialMedia } from '../database/model.js'


export const handlerFunctions = {
  sessionCheck: async (req, res) => {
    // when this function is called, we simply want to check if there is a userId on the req.session object, and send it back if so
    if (req.session.userId) {
      // if you want more info about the user to return, you can just query right now with a findByPk():
      // const user = await User.findByPk(req.session.userId)

      const userInSession = await User.findByPk(req.session.userId, {
        include: [
            {
                model: Favorites, 
                include: { 
                    model: Product 
                }
            }, 
            {
                model: SocialMedia
            }
        ]
    })

      // const userFavorites = await Favorites.findAll({
      //   where: {
      //     userId: req.session.userId
      //   },
      //   include: {
      //     model: Product
      //   }
      // })
      // const socialMediaHandles = await SocialMedia.findAll({
      //   where: {
      //     userId: req.session.userId
      //   }
      // });

      res.send({
        message: "user is still logged in",
        success: true,
        user: userInSession,
        // userId: req.session.userId,
        // userFavorites: userFavorites,
        // socialMediaHandles: socialMediaHandles
      })
      return
    } else { 
      res.send({
        message: "no user logged in",
        success: false,
      })
      return

    }
  },

  login: async (req, res) => {
    // grab values of 'username'/'password' from body object
    const { username, password } = req.body

    // see if a user exists in the db with 
    // the provided username
    const user = await User.findOne({
      where: {
        username: username
      },
      include: [
        {
            model: Favorites, 
            include: { 
                model: Product 
            }
        }, 
        {
            model: SocialMedia
        }
    ]
    })

    
    // need to evaluate if that worked, if not,
    // can already respond that login failed
    if (!user) {
      res.send({
        message: 'no username found',
        success: false
      })
      return
    }
    
    // if we're here, then the user was found
    // now evaluate if the passwords match
    if (user.password !== password) {
      res.send({
        message: 'password does not match',
        success: false,
      })
      return
    }
    // another query to grab the user's favorites (like in sessionCheck)
  //   const userFavorites = await Favorites.findAll({
  //     where: {
  //       userId: user.userId
  //     },
  //     include: {
  //       model: Product
  //     }
  // })

    // if we're here, then the user exists 
    // AND their password was correct!
    // So I want to "save" their userId to a cookie --> req.session
    req.session.userId = user.userId
    // req.session is a cookie saved on the user's browser. 
    // so each user that visits our site sends their custom "req" object to us, and therefore, as far as their browser knows, they are "logged in"

    // if we're here, then all is a success
    // send a response including the userId:

    res.send({
      message: "user logged in",
      success: true,
      // userId: req.session.userId,
      // userFavorites: userFavorites,
      user: user
    })

  },

  logout: async(req, res) => {
    req.session.destroy()

    res.send({
      message: "user logged out",
      success: true
    })
    return
  },


  getAllProducts: async (req, res) => {
    const allProducts = await Product.findAll({ 
      include: {
        model: Favorites
      }
    })
    res.send(allProducts);
  },

 


  getAllStores: async (req, res) => {
    const allStores = await Store.findAll()
    res.send(allStores);
  },

  addToFavorites: async (req, res) => {
    try {
      const { userId, productId } = req.body;
  
      // Check if the user exists
      const user = await User.findOne({
        where: {
          userId: userId
        }
      });
  
      // Check if the product exists
      const product = await Product.findOne({
        where: {
          productId: productId
        }
      });
  
      // If user or product doesn't exist, return 404
      if (!user || !product) {
        return res.status(404).json({ message: "User or product not found" });
      }
  
      // Check if the product is already in favorites
      const existingFavorite = await Favorites.findOne({
        where: {
          userId: userId,
          productId: productId
        }
      });
  
      // If the product is already in favorites, return 400
      if (existingFavorite) {
        return res.status(400).json({ message: "Product already in favorites" });
      }
  
      // Add the product to favorites
      const addFav = await Favorites.create({
        userId: userId,
        productId: productId
      });
      console.log(addFav)

      const newFav = await Favorites.findOne({
        where:{
          id: addFav.id
        },
        include:Product
      })
      // Return success message
      return res.status(201).json(newFav);
      // return res.status(201).json({ message: "Product added to favorites" });
    } catch (error) {
      console.error("Error adding product to favorites:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  removeFromFavorites: async (req, res) => {
    try {
      const { userId, productId } = req.body;

        // Check if the user exists
        const user = await User.findOne({
          where: {
            userId: userId
          }
        });
    
        // Check if the product exists
        const product = await Product.findOne({
          where: {
            productId: productId
          }
        });

      if (!user || !product) {
        return res.status(404).json({ message: "User or product not found" });
      }

      // Check if the product is in favorites
      const existingFavorite = await Favorites.findOne({
        where: {
          userId: userId,
          productId: productId
        }
      });

      if (!existingFavorite) {
        return res.status(400).json({ message: "Product not found in favorites" });
      }

      // Remove the product from favorites
      await existingFavorite.destroy();

      return res.status(200).json({ message: "Product removed from favorites" });
    } catch (error) {
      console.error("Error removing product from favorites:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
  // getAllFavorites: async (req, res) => {
  //   const userId = req.params.userId;
  //   Favorite.findAll({
  //       where: { userId }
  //   })
  //   .then(favorites => {
  //       res.send({ favorites: favorites });
  //   });
  // }


  getAllFavorites: async (req, res) => {
    if (req.session.userId){
    let favorites = await Favorites.findAll({
      where:{
        userId: req.session.userId
      },
      include: Product
    })
    res.send(favorites)
  } else {
    res.send([])
  }
  },
  signup: async (req, res) => {
    try {
      const { name, username, password } = req.body;
      
      // Check if the username already exists
      const existingUser = await User.findOne({
        where: {
          username: username
        }
      });
      
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Create a new user
      const newUser = await User.create({
        name: name,
        username: username,
        password: password
      });
      
      res.status(201).json({ message: "User created successfully" });
    } catch (error) {
      console.error("Error signing up user:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
  updateProfile: async (req, res) => {
      try {
        const { name, username, password } = req.body;
        
        // Check if the user is logged in
        if (!req.session.userId) {
          return res.status(401).json({ message: "User not authenticated" });
        }
  
        // Update user information
        const user = await User.findByPk(req.session.userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
  
        user.name = name;
        user.username = username;
        if (password) {
          user.password = password;
        }
  
        await user.save();
  
        res.status(200).json({ message: "User information updated successfully" });
      } catch (error) {
        console.error("Error updating profile:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    },
    saveSocialMediaHandle: async (req, res) => {
      try {
        const { platform, handle } = req.body;
        
        // Check if the user is logged in
        if (!req.session.userId) {
          return res.status(401).json({ message: "User not authenticated" });
        }
  
        // Save social media handle to database
        const newHandle = await SocialMedia.create({
          userId: req.session.userId,
          platform,
          handle
        });
  
        res.status(201).json({ 
          message: "Social media handle saved successfully",
          newHandle: newHandle
        });
      } catch (error) {
        console.error("Error saving social media handle:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    }
  
  
  

 
}