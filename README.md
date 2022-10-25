# nodejs static server
`server.js` 是动态服务器的原始代码。  
静态服务器：没有请求数据库  
动态服务器：请求了数据库  

## 启动应用

`node-dev server.js 8080`

在浏览器访问`localhost:8080/register.html`，进行注册、登录。  
登录有两种方式：
- 利用 cookie 传 user_id
- 利用 session 传 session_id

## 后台启动应用

```shell
touch log
node-dev server.js 8888 >log log 2>&1 &
```