const passport = require('passport');
const mongoose = require('mongoose');
const User = mongoose.model('User');

const register = async (req, res) => {
    if (!req.body.name || !req.body.email || !req.body.password) {
        return res
            .status(400)
            .json({"message": "All fields required"});
    }

    const user = new User();
    user.name = req.body.name;
    user.email = req.body.email;
    user.setPassword(req.body.password);

    try {
        // save()를 async/await 방식으로 처리
        await user.save();
        const token = user.generateJwt();
        res
            .status(200)
            .json({token});
    } catch (err) {
        res
            .status(404)
            .json(err);
    }
};


const login = async (req, res) => {
    if (!req.body.email || !req.body.password) {
        return res
            .status(400)
            .json({ message: "All fields required" });
    }

    passport.authenticate('local', async (err, user, info) => {
        if (err) {
            console.error("Authentication error:", err); // 에러 로그 출력
            return res.status(404).json(err);
        }

        if (user) {
            try {
                // JWT 생성
                const token = user.generateJwt();
                return res.status(200).json({ token });
            } catch (tokenError) {
                console.error("Token generation error:", tokenError);
                return res.status(500).json({ message: "Token generation failed" });
            }
        } else {
            // 인증 실패 정보 반환
            return res.status(401).json(info);
        }
    })(req, res);
};


module.exports = {
    register,
    login
};