// BASE SETUP
// =============================================================================

var express = require('express'),
	bodyParser = require('body-parser');

var app = express();
app.use(bodyParser());

var env = app.get('env') == 'development' ? 'dev' : app.get('env');
// var port = process.env.PORT || 8080;
// 改下端口, 8080 已被 apache 占用
var port = process.env.PORT || 3000;


// IMPORT MODELS
// =============================================================================
// docs: http://docs.sequelizejs.com/en/latest/
var Sequelize = require('sequelize');

// 上面已经定义了 env, 这里又定义一次。
// db config
// var env = "dev";
var config = require('./database.json')[env];
var password = config.password ? config.password : null;

// 改下配置
config = {
	"driver": "mysql",
  "user": "root",
  "database": "pjanaya-nodejs-express4-mysql",
  "password": null
};

// initialize database connection
var sequelize = new Sequelize(
	config.database,
	config.user,
	config.password,
	{
    dialect: config.driver,
    logging: console.log,
		define: {
			// 不要自动添加  createdAt and updatedAt
			timestamps: false
		}
	}
);

var crypto = require('crypto');
// 重复引入，这样好吗？
var DataTypes = require("sequelize");

// define(modelName, attributes, [options]) -> Model
// http://docs.sequelizejs.com/en/latest/api/sequelize/#definemodelname-attributes-options-model
var User = sequelize.define('users', {
    username: DataTypes.STRING,
    password: DataTypes.STRING
  }, {
  	// 添加实例方法。实例由 Model.build() 创建
  	// http://docs.sequelizejs.com/en/latest/docs/models-definition/#expansion-of-models
  	// 这些方法都是用回调而不是 Promise
    instanceMethods: {
      retrieveAll: function(onSuccess, onError) {
      // findAll([options], [queryOptions]) -> Promise<Array<Instance>>
      // http://docs.sequelizejs.com/en/latest/api/model/#findalloptions-queryoptions-promisearrayinstance
      // 不提供 options 则用 null
      // query(sql, [callee], [options={}]) -> Promise
      // http://docs.sequelizejs.com/en/latest/api/sequelize/#querysql-callee-options-promise
      // options.raw 不实例化结果
      // sequelize 2.x sucess() 与 error() 已废弃，使用 Promise API
			User.findAll({}, {raw: true}).success(onSuccess).error(onError);
	  },
      retrieveById: function(user_id, onSuccess, onError) {
			User.find({where: {id: user_id}}, {raw: true}).success(onSuccess).error(onError);
	  },
      add: function(onSuccess, onError) {
			var username = this.username;
			var password = this.password;

			// 加密密码
			var shasum = crypto.createHash('sha1');
			shasum.update(password);
			password = shasum.digest('hex');

			// 先 build() 再 save() 保存到数据库
			// 可以用 create() 一步完成
			// http://docs.sequelizejs.com/en/latest/api/model/index.html#createvalues-options-promiseinstance
			User.build({ username: username, password: password })
			    .save().success(onSuccess).error(onError);
	   },
	  updateById: function(user_id, onSuccess, onError) {
			var id = user_id;
			var username = this.username;
			var password = this.password;

			var shasum = crypto.createHash('sha1');
			shasum.update(password);
			password = shasum.digest('hex');

			// http://docs.sequelizejs.com/en/latest/api/model/index.html#updatevalues-options-promisearrayaffectedcountaffectedrows
			User.update({ username: username,password: password},{where: {id: id} }).success(onSuccess).error(onError);
	   },
      removeById: function(user_id, onSuccess, onError) {
			// http://docs.sequelizejs.com/en/latest/api/model/index.html#destroyoptions-promiseundefined
			User.destroy({where: {id: user_id}}).success(onSuccess).error(onError);
	  }
    }
  });


// IMPORT ROUTES
// =============================================================================
var router = express.Router();

// on routes that end in /users
// ----------------------------------------------------
router.route('/users')

// create a user (accessed at POST http://localhost:8080/api/users)
.post(function(req, res) {

	var username = req.body.username; //bodyParser does the magic
	var password = req.body.password;

	// http://docs.sequelizejs.com/en/latest/api/model/index.html#buildvalues-options-instance
	// http://docs.sequelizejs.com/en/latest/docs/instances/
	var user = User.build({ username: username, password: password });

	user.add(function(success){
		res.json({ message: 'User created!' });
	},
	function(err) {
		res.send(err);
	});
})

// get all the users (accessed at GET http://localhost:8080/api/users)
.get(function(req, res) {
	var user = User.build();

	user.retrieveAll(function(users) {
		if (users) {
		  res.json(users);
		} else {
		  res.send(401, "User not found");
		}
	  }, function(error) {
		res.send("User not found");
	  });
});


// on routes that end in /users/:user_id
// ----------------------------------------------------
router.route('/users/:user_id')

// update a user (accessed at PUT http://localhost:8080/api/users/:user_id)
.put(function(req, res) {
	var user = User.build();

	user.username = req.body.username;
	user.password = req.body.password;

	user.updateById(req.params.user_id, function(success) {
		console.log(success);
		if (success) {
			res.json({ message: 'User updated!' });
		} else {
		  res.send(401, "User not found");
		}
	  }, function(error) {
		res.send("User not found");
	  });
})

// get a user by id(accessed at GET http://localhost:8080/api/users/:user_id)
.get(function(req, res) {
	var user = User.build();

	user.retrieveById(req.params.user_id, function(users) {
		if (users) {
		  res.json(users);
		} else {
		  res.send(401, "User not found");
		}
	  }, function(error) {
		res.send("User not found");
	  });
})

// delete a user by id (accessed at DELETE http://localhost:8080/api/users/:user_id)
.delete(function(req, res) {
	var user = User.build();

	user.removeById(req.params.user_id, function(users) {
		if (users) {
		  res.json({ message: 'User removed!' });
		} else {
		  res.send(401, "User not found");
		}
	  }, function(error) {
		res.send("User not found");
	  });
});

// Middleware to use for all requests
// http://localhost:3000/api/
router.use(function(req, res, next) {
	// do logging
	console.log('Something is happening.');
	next();
});

// REGISTER OUR ROUTES
// =============================================================================
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);

