require('dotenv').config()

const express = require('express')
// const cookieParser        = require('cookie-parser')
// const { DatabaseManager } = require('./db')
const bodyParser          = require('body-parser')
const flash_middleware    = require('./flash')
// const useragent           = require('useragent')
// const { DateTime }        = require('luxon')
const { spawn } = require('child_process')
const cookieParser = require('cookie-parser')

const app = express()

app.set('view engine', 'ejs')
app.use(cookieParser(process.env['APP_SECRET']))
app.use(bodyParser.urlencoded({extended: true}))
app.use('/static', express.static('static'))
app.use(flash_middleware)

const auth_required = (req, res, next) => {
    if (req.signedCookies['auth'] !== process.env['AUTH_CODE']) {
        res.redirect('/401')
    } else {
        next()
    }
}

app.get('/401', async (_, res) => {
    res.statusCode = 401
    res.render('unauth')
})

app.get('/', async (req, res) => {

    let msgs = req.flash.pop()
    res.clearCookie('auth')
    res.render('login', {
        msgs
    })
})

app.get('/app',
    auth_required,
    (req, res) => {
        res.render('app')
    }
)
app.post('/api/authenticate',
    bodyParser.urlencoded({extended: true}),
    (req, res) => {
        if (req.body.code === process.env['AUTH_CODE']) {
            res.cookie('auth', process.env['AUTH_CODE'], {
                maxAge: (+Date.now()/1000) + (60 * 60 * 2), 
                signed: true,
                httpOnly: true,
                secret: req.secret
            })

            const body = 'New login processed.'
            const title = 'pasteboard'
            const notifier = spawn('osascript', [
                '-e',
                `display notification "${body}" with title "${title}"`
            ])
            notifier.unref()

            res.redirect('/app')
        } else {
            req.flash.push('invalid login')
            res.redirect('/')
        }
    }
)

app.post('/api/copy',
    auth_required,
    bodyParser.json(),
    async (req, res) => {
        console.log(`pasting "${req.body.text}"`)
        const pbcopy = spawn('pbcopy')
        pbcopy.stdin.end(req.body.text)
        pbcopy.unref()

        res.json({success: true})
    }
)



const PORT = process.env['APP_PORT'] ?? 8080
app.listen(PORT, () => console.log(`auth server listening on ${PORT}`))
