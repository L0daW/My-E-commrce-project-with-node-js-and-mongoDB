const mongoose = require("mongoose");
const validator = require("validator"); 
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const passwordComplexity = require("joi-password-complexity");
const { BadRequestError } = require('../customError');



const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
        },
        lastName: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
        },
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 3,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            validate(value) {
                if (!validator.isEmail(value)) {
                    throw new Error("Email is invalid");
                }
            },
        },
        /*for password 
        {
            min: 8,
            max: 26,
            lowerCase: 1,
            upperCase: 1,
            numeric: 1,
            symbol: 1,
            requirementCount: 4,
        }*/
        password: {
            type: String,
            required: true,
            minlength: 7,
            trim: true,
            validate: {
                validator: function (value) {
                    // Validate using joi-password-complexity
                    return passwordComplexity().validate(value);
                },
                message:
                    "Password does not meet complexity requirements. It should contain at least one lowercase letter, one uppercase letter, one digit, and one special character.",
            },
        },
        phoneNumber: {
            type: String,
            required: true,
            validate(value) {
                if (!/^01[0125][0-9]{8}$/.test(value)) {
                    throw new Error("Invalid phone number");
                }
            },
        },
        address: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ["user", "admin"], 
            default: "user",
        },
        tokens: [
            {
                token: {
                    type: String,
                    required: true,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

userSchema.methods.generateAuthToken = async function () {
    try {
        const user = this;
        const token = jwt.sign(
            { _id: user._id.toString() },
            process.env.JWT_SECRET,
            { expiresIn: "2h" } // Token expiration time
        );
        user.tokens = user.tokens.concat({ token });
        await user.save();
        return token;
    } catch (error) {
        throw new Error("Unable to generate authentication token");
    }
};

userSchema.statics.findByCredentials = async (email, password) => {
    try {
        const user = await User.findOne({ email });
        if (!user) {
            throw new BadRequestError("Email or password is incorrect");
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new BadRequestError("Email or password is incorrect");
        }
        return user;
    } catch (error) {
        return error; // Return the error object
    }
};



userSchema.pre("save", async function (next) {
    const user = this;
    if (user.isModified("password")) {
        try {
            user.password = await bcrypt.hash(user.password, 8);
        } catch (error) {
            throw new BadRequestError("Unable to hash password");
        }
    }
    next();
});

const User = mongoose.model("User", userSchema);
module.exports = User;