let http = require('http')
let fs = require('fs')
let url = require('url')
let port = process.argv[2]

if (!port) {
    console.log('请指定端口号好不啦？\nnode server.js 8888 这样不会吗？')
    process.exit(1)
}

let server = http.createServer(function (request, response) {
    let parsedUrl = url.parse(request.url, true)
    let pathWithQuery = request.url
    let queryString = ''
    if (pathWithQuery.indexOf('?') >= 0) {
        queryString = pathWithQuery.substring(pathWithQuery.indexOf('?'))
    }
    let path = parsedUrl.pathname
    let query = parsedUrl.query
    let method = request.method

    /******** 从这里开始看，上面不要看 ************/

    console.log('有个傻子发请求过来啦！路径（带查询参数）为：' + pathWithQuery)

    if (path === '/signIn-session' && method === 'POST') {
        let usersArray = JSON.parse(fs.readFileSync('./db/users.json'))
        let array = []
        request.on('data', (chunk) => {
            array.push(chunk)
        })
        request.on('end', () => {
            let string = Buffer.concat(array).toString() // array 接收的是一个 Buffer 实例，需要连接起来
            let obj = JSON.parse(string)
            let user = usersArray.find((user) => user.name === obj.name && user.password === obj.password)
            if (user === undefined) {
                response.statusCode = 400
                response.setHeader('Content-Type', 'text/json;charset=utf-8')
                response.end(`{"errorCode": 4001, "errorMsg":"user not found"}`)
            } else {
                response.statusCode = 200
                let random = Math.random()
                let session = JSON.parse(fs.readFileSync('./session.json').toString())
                session[random] = { user_id: user.id }
                fs.writeFileSync('./session.json', JSON.stringify(session))
                response.setHeader('Set-Cookie', `session_id=${random}; HttpOnly`)
                response.end()
            }
        })
    } else if (path === '/home-session-login') {
        let cookie = request.headers['cookie']
        let string = fs.readFileSync('./public/home.html').toString()
        let res_string = null
        let sessionId_cookie = cookie.split(';').find(s => s.indexOf('session_id') >= 0)
        let sessionId_str = sessionId_cookie.match(/session_id=(.*)/i)[1]
        if (sessionId_str) {
            let session = JSON.parse(fs.readFileSync('./session.json').toString())
            let usersArray = JSON.parse(fs.readFileSync('./db/users.json').toString())
            let user = usersArray.find(user => user.id === session[sessionId_str]['user_id'])
            if (user) {
                res_string = string.replace('{{loginStatus}}', '已登录').replace('{{user.name}}', user.name)
                response.write(res_string)
            } else {
                res_string = string.replace('{{loginStatus}}', '未登录').replace('{{user.name}}', '')
                response.write(res_string)
            }
        } else {
            res_string = string.replace('{{loginStatus}}', '未登录').replace('{{user.name}}', '')
            response.write(res_string)
        }
        response.end()
    } else if (path === '/signIn-cookie' && method === 'POST') {
        let usersArray = JSON.parse(fs.readFileSync('./db/users.json'))
        let array = []
        request.on('data', (chunk) => {
            array.push(chunk)
        })
        request.on('end', () => {
            let string = Buffer.concat(array).toString()
            let obj = JSON.parse(string)
            let user = usersArray.find((user) => user.name === obj.name && user.password === obj.password)
            if (user === undefined) {
                response.statusCode = 400
                response.setHeader('Content-Type', 'text/json;charset=utf-8')
                response.end(`{"errorCode": 4001, "errorMsg":"user not found"}`)
            } else {
                response.statusCode = 200
                response.setHeader('Set-Cookie', `user_id=${user.id}; HttpOnly`)
                response.end()
            }
        })
    } else if (path === '/home-cookie-login') {
        let cookie = request.headers['cookie']
        let string = fs.readFileSync('./public/home.html').toString()
        let res_string = null
        let userId_cookie = cookie.split(';').find(s => s.indexOf('user_id=') >= 0)
        let userId_str = userId_cookie.match(/user_id=(.*)/i)[1]
        if (userId_str) {
            let usersArray = JSON.parse(fs.readFileSync('./db/users.json').toString())
            let user = usersArray.find(user => user.id.toString() === userId_str)
            res_string = string.replace('{{loginStatus}}', '已登录').replace('{{user.name}}', user.name)
            response.write(res_string)
        } else {
            res_string = string.replace('{{loginStatus}}', '未登录').replace('{{user.name}}', '')
            response.write(res_string)
        }
        response.end()
    } else if (path === '/register' && method === 'POST') {
        response.setHeader('Content-Type', 'text/html;charset=utf-8')
        let usersArray = JSON.parse(fs.readFileSync('./db/users.json'))
        let array = []
        request.on('data', (chunk) => {
            array.push(chunk)
        })
        request.on('end', () => {
            let string = Buffer.concat(array).toString()
            let obj = JSON.parse(string)
            let lastUser = usersArray[usersArray.length - 1] || null
            let newUser = {
                id: (lastUser ? lastUser.id + 1 : 1),
                name: obj.name,
                password: obj.password
            }
            usersArray.push(newUser)
            fs.writeFileSync('./db/users.json', JSON.stringify(usersArray))
            response.statusCode = 200
            response.end()
        })
    } else {
        response.statusCode = 200
        let resourcePath = path === '/' ? '/index.html' : path
        // 文件名后缀
        let suffix = resourcePath.substring(resourcePath.lastIndexOf('.'))
        const FILETYPE = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'text/javascript',
            '.png': 'image/png',
            '.jpg': 'image/jpeg'
        }
        let filetype = FILETYPE[suffix] || 'text/html'
        response.setHeader('Content-Type', `${filetype};charset=utf-8`)
        let content = null
        try {
            content = fs.readFileSync(`./public${resourcePath}`)
        } catch (error) {
            if (error.code === 'ENOENT') {
                content = '文件不存在！'
                response.statusCode = 404
            } else {
                throw error
            }
        }
        response.write(content)
        response.end()
    }

    /******** 代码结束，下面不要看 ************/
})

server.listen(port)
console.log('监听 ' + port + ' 成功\n请用在空中转体720度然后用电饭煲打开 http://localhost:' + port)
