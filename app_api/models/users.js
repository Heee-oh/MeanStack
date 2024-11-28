// 2020700086 허찬욱
const mongoose = require('mongoose');
const crypto = require('crypto');
require('dotenv').config();

const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true
    },
    name : {
        type: String,
        required: true
    },
    hash: String,
    salt: String
});

userSchema.methods.setPassword = function (Password) {
    this.salt = crypto.randomBytes(16).toString('hex');
    this.hash = crypto
        .pbkdf2Sync(Password,this.salt,1000,64,'sha512')
        .toString('hex');
    };

    userSchema.methods.validPassword = function(Password) {
        const hash = crypto
            .pbkdf2Sync(Password, this.salt,1000,64,'sha512')
            .toString('hex');
        return this.hash === hash;
    }

    userSchema.methods.generateJwt = function () {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 7);
        return jwt.sign({
            _id: this._id,
            email: this.email,
            name: this.name,
            exp: parseInt(expiry.getTime() / 1000, 10),
        }, process.env.JWT_SECRET);
    };
    
mongoose.model('User', userSchema);