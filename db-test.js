let fs = require("fs")

// 读数据库
let usersString = fs.readFileSync('./db/users.json').toString()
let usersArray = JSON.parse(usersString)

// 写数据库
let users3 = {
    "id": 3,
    "name": "tom",
    "password": "yyy"
}
usersArray.push(user3)
let string = JSON.stringify(usersArray)
fs.writeFileSync('./db/users.json', string)