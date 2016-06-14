
'use strict';

var fs = require('fs');
var url = require('url');
var http = require('http');
var crypto = require('crypto');
var querystring = require('querystring');

var ob_resolver = require('./ob_resolver.js');

var QUEUE_NAMES = [ 'Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ', 'Ⅷ', 'Ⅸ', 'Ⅹ' ]
var TIER_NAMES = [ '最强王者', '钻石', '铂金', '黄金', '白银', '青铜', '超凡大师' ];
var AREA_NAMES = [
	'艾欧尼亚  电信', '比尔吉沃特  网通', '祖安 电信', '诺克萨斯  电信', '德玛西亚 网通',
	'班德尔城 电信', '皮尔特沃夫 电信', '战争学院 电信', '弗雷尔卓德 网通', '巨神峰 电信',
	'雷瑟守备 电信', '无畏先锋 网通', '裁决之地 电信', '黑色玫瑰 电信', '暗影岛 电信',
	'钢铁烈阳 电信', '恕瑞玛 网通', '均衡教派 电信', '水晶之痕 电信', '教育网专区',
	'影流 电信', '守望之海 电信', '扭曲丛林 网通', '征服之海 电信', '卡拉曼达 电信',
	'皮城警备 电信', '巨龙之巢 网通'
];

var ob_http = function (port, cmysql)
{
	var self = this;

	this.m_port = port;
	this.m_http = null;
	this.m_mysql = cmysql;
	this.m_resolvers = {};

	///////////////////////////////////////////////////////////////////////
	// Web browser handlers
	///////////////////////////////////////////////////////////////////////

	this.respose_success_page = function (headers, content, res)
	{
		if (null == headers)
		{
			res.statusCode = 200;
		}
		else
		{
			res.writeHead(200, headers);
		}

		if (null == content)
		{
			res.end('');
		}
		else
		{
			res.end(content);
		}
	};

	this.respose_error_page = function (res)
	{
		res.statusCode = 400;
		res.end('');
	};

	this.handle_index_page = function (url_path, res, params)
	{
		self.respose_error_page(res);
	};

	this.handle_favicon = function (url_path, res, params)
	{
		if (!fs.existsSync('./lol_ob.ico'))
		{
			self.respose_error_page(res);
			return;
		}

		fs.readFile('./lol_ob.ico', function (err, data)
		{
			if (err)
			{
				self.respose_error_page(res);
				return;
			}

			self.respose_success_page({
				'Content-Type' : 'image/x-icon',
				'Content-Length' : data.length,
				'ETag' : '"' + crypto.createHash('md5').update(data).digest("hex") + '"'
			}, data, res);
		});
	};

	this.handle_search_ob_list = function (url_path, res, params)
	{
		var OB_PER_PAGE = 20;
		if (1 == params.length)
		{
			var str_where = 'ob_file_status = 1';
			var url_query = url.parse(url_path).query;
			var url_params = querystring.parse(url_query);

			if (null != url_params.bh)
			{
				str_where += ' AND INSTR(banned, \'"championId":' +
					url_params.bh + ',\') > 0';
			}

			if (null != url_params.uh)
			{
				str_where += ' AND INSTR(participants, \'"championId":' +
					url_params.uh + ',\') > 0';
			}

			if (null != url_params.aid)
			{
				str_where += ' AND area_id = ' + url_params.aid;
			}

			if (null != url_params.gid)
			{
				str_where += ' AND game_id = ' + url_params.gid;
			}

			if (null != url_params.gll)
			{
				str_where += ' AND game_length >= ' + url_params.gll;
			}

			if (null != url_params.glu)
			{
				str_where += ' AND game_length <= ' + url_params.glu;
			}

			if (null != url_params.gstb)
			{
				str_where += ' AND game_start_time >= ' + url_params.gstb;
			}

			if (null != url_params.gste)
			{
				str_where += ' AND game_start_time <= ' + url_params.gste;
			}

			var str_sql = 'SELECT area_id, game_id, platform_id, game_length, game_start_time, encryption_key, banned, participants FROM ob_info ' +
				'WHERE ' + str_where + ' ORDER BY log_time';
			// console.log('%s Query OB list: sql = %s'.debug, new Date().getCurTime(), str_sql);

			self.m_mysql.query(str_sql, function (err1, rows, fields)
			{
				if (err1)
				{
					console.log('%s Query OB file list failed!'.error, new Date().getCurTime());

					self.respose_error_page(res);
					return;
				}

				var obj_ret = [];
				for (var i = 0; i < rows.length; i++)
				{
					var banned_obj = JSON.parse(rows[i].banned);
					var participants_obj = JSON.parse(rows[i].participants);
					if (null == banned_obj ||
						null == participants_obj)
					{
						continue;
					}

					obj_ret.push({
						'aid' : rows[i].area_id,
						'gid' : rows[i].game_id,
						'pid' : rows[i].platform_id,
						'gl' : rows[i].game_length,
						'gt' : rows[i].game_start_time,
						'ek' : rows[i].encryption_key,
						'b' : banned_obj,
						'p' : participants_obj
					});
				}

				self.respose_success_page(
					{ 'Content-Type' : 'application/json; charSet=UTF-8' },
					JSON.stringify(obj_ret), res);
			});
		}
		else
		{
			console.log('%s Get OB list error: %s'.error,
				new Date().getCurTime(), url_path);

			self.respose_error_page(res);
		}
	};

	this.handle_download_ob_file = function (url_path, res, params)
	{
		if (2 == params.length)
		{
			var ob_file = './' + params[1];
			if (fs.existsSync(ob_file))
			{
				fs.readFile(ob_file, function (err1, data)
				{
					if (err1)
					{
						self.respose_error_page(res);
						return;
					}

					self.respose_success_page({
						'Content-Type' : 'application/octet-stream',
						'Content-Length' : data.length,
						'ETag' : '"' + crypto.createHash('md5').update(data).digest("hex") + '"'
					}, data, res);
				});
			}
		}
		else
		{
			console.log('%s Download OB file error: %s'.error,
				new Date().getCurTime(), url_path);

			self.respose_error_page(res);
		}
	};

	/////////////////////////////////////////////////////////////////////////
	// LOL protocol handlers
	/////////////////////////////////////////////////////////////////////////

	this.get_resolver = function (platform_id, game_id)
	{
		var resolver_key = platform_id + '_' + game_id;
		var ob_file = './' + platform_id + '/' + game_id + '.ob';
		if (fs.existsSync(ob_file))
		{
			var resolver = null;
			if (null == self.m_resolvers[resolver_key])
			{
				resolver = ob_resolver.create(ob_file);
				self.m_resolvers[resolver_key] = resolver;
			}
			else
			{
				resolver = self.m_resolvers[resolver_key];
			}

			return resolver;
		}

		return null;
	};

	this.handle_featured = function (url_path, res, params)
	{
		self.respose_success_page({ 'Content-Type' : 'text/plain' }, 'for test', res);
	};

	this.handle_version = function (url_path, res, params)
	{
		self.respose_success_page({ 'Content-Type' : 'text/plain' }, '1.82.98', res);
	};

	this.handle_game_meta_data = function (url_path, res, params)
	{
		if (4 == params.length)
		{
			// console.log('%s handle_game_meta_data platform_id = %s, game_id = %s'.info,
				// new Date().getCurTime(), params[1], params[2]);

			var resolver = self.get_resolver(params[1], params[2]);
			if (null == resolver)
			{
				self.respose_error_page(res);
			}
			else
			{
				var game_meta_data = JSON.stringify(resolver.get_game_meta_data());
				self.respose_success_page({ 'Content-Type' : 'application/json; charSet=UTF-8' }, game_meta_data, res);
			}
		}
		else
		{
			console.log('%s Game meta data URL error: %s'.error,
				new Date().getCurTime(), url_path);
		}

		self.respose_error_page(res);
	};

	this.handle_last_chunk_info_token = function (url_path, res, params)
	{
		if (4 == params.length)
		{
			// console.log('%s handle_last_chunk_info_token platform_id = %s, game_id = %s, param = %s'.info,
				// new Date().getCurTime(), params[1], params[2], params[3]);

			var resolver = self.get_resolver(params[1], params[2]);
			if (null == resolver)
			{
				self.respose_error_page(res);
			}
			else
			{
				var last_chunk_info = JSON.stringify(resolver.get_last_chunk_info(params[1], params[2], params[3]));
				self.respose_success_page({ 'Content-Type' : 'application/json; charSet=UTF-8' }, last_chunk_info, res);
			}
		}
		else
		{
			console.log('%s Last chunk info token URL error: %s'.error,
				new Date().getCurTime(), url_path);

			self.respose_error_page(res);
		}
	};

	this.handle_game_data_chunk = function (url_path, res, params)
	{
		if (4 == params.length)
		{
			// console.log('%s handle_game_data_chunk platform_id = %s, game_id = %s, chunk_id = %s'.info,
				// new Date().getCurTime(), params[1], params[2], params[3]);

			var resolver = self.get_resolver(params[1], params[2]);
			if (null == resolver)
			{
				self.respose_error_page(res);
			}
			else
			{
				var game_data_chunk = resolver.get_game_data_chunk(params[1], params[2], params[3]);
				if (null == game_data_chunk)
				{
					console.log('%s Game data chunk not found: platform_id = %s, game_id = %s, chunk_id = %s'.error,
						new Date().getCurTime(), params[1], params[2], params[3]);

					self.respose_error_page(res);
					return;
				}

				self.respose_success_page(null, game_data_chunk, res);
			}
		}
		else
		{
			console.log('%s Game data chunk URL error: %s'.error,
				new Date().getCurTime(), url_path);

			self.respose_error_page(res);
		}
	};

	this.handle_key_frame = function (url_path, res, params)
	{
		if (4 == params.length)
		{
			// console.log('%s handle_key_frame platform_id = %s, game_id = %s, keyframe_id = %s'.info,
				// new Date().getCurTime(), params[1], params[2], params[3]);

			var resolver = self.get_resolver(params[1], params[2]);
			if (null == resolver)
			{
				self.respose_error_page(res);
			}
			else
			{
				var keyframe = resolver.get_keyframe(params[1], params[2], params[3]);
				if (null == keyframe)
				{
					console.log('%s Keyframe not found: platform_id = %s, game_id = %s, keyframe_id = %s'.error,
						new Date().getCurTime(), params[1], params[2], params[3]);

					self.respose_error_page(res);
					return;
				}

				self.respose_success_page(null, keyframe, res);
			}
		}
		else
		{
			console.log('%s Key frame URL error: %s'.error,
				new Date().getCurTime(), url_path);

			self.respose_error_page(res);
		}
	};

	this.handle_last_chunk_info_null = function (url_path, res, params)
	{
		if (4 == params.length)
		{
			// console.log('%s handle_last_chunk_info_null platform_id = %s, game_id = %s'.info,
				// new Date().getCurTime(), params[1], params[2]);

			self.respose_success_page(null, '', res);
		}
		else
		{
			console.log('%s Last chunk info null URL error: %s'.error,
				new Date().getCurTime(), url_path);

			self.respose_error_page(res);
		}
	};

	this.url_handlers = {
		'/$' : self.handle_index_page,
		'/favicon\\.ico' : self.handle_favicon,
		'/search(?:\\?.+)?' : self.handle_search_ob_list,
		'/([^\.]+\\.ob)' : self.handle_download_ob_file,
		'/observer-mode/rest/featured' : self.handle_featured,
		'/observer-mode/rest/consumer/version' : self.handle_version,
		'/observer-mode/rest/consumer/getGameMetaData/([^/]+)/([^/]+)/([^/]+)/token' : self.handle_game_meta_data,
		'/observer-mode/rest/consumer/getLastChunkInfo/([^/]+)/([^/]+)/([^/]+)/token' : self.handle_last_chunk_info_token,
		'/observer-mode/rest/consumer/getGameDataChunk/([^/]+)/([^/]+)/([^/]+)/token' : self.handle_game_data_chunk,
		'/observer-mode/rest/consumer/getKeyFrame/([^/]+)/([^/]+)/([^/]+)/token' : self.handle_key_frame,
		'/observer-mode/rest/consumer/getLastChunkInfo/([^/]+)/([^/]+)/null' : self.handle_last_chunk_info_null,
		'/observer-mode/rest/consumer/end/([^/]+)/([^/]+)/([^/]+)/token' : self.handle_last_chunk_info_null
	};

	this.stop = function ()
	{
		if (null == self.m_http)
		{
			return;
		}

		self.m_http.close();
	};

	this.start = function ()
	{
		self.stop();

		self.m_http = http.createServer(function (req, res)
		{
			// console.log('%s LOL Client request: method = %s, url = %s'.info,
				// new Date().getCurTime(), req.method, req.url);

			for (var key in self.url_handlers)
			{
				var re_key = new RegExp(key);
				var params = re_key.exec(req.url);
				if (null != params)
				{
					if (typeof self.url_handlers[key] === 'function')
					{
						self.url_handlers[key](req.url, res, params);
						return;
					}
				}
			}

			console.log('%s LOL Client unhandled request: method = %s, url = %s'.info,
				new Date().getCurTime(), req.method, req.url);

			self.respose_error_page(res);
		});

		self.m_http.listen(self.m_port);
	};
};

exports.create = function (port, cmysql)
{
	return new ob_http(port, cmysql);
};
