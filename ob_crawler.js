
'use strict';

var fs = require('fs');
var util = require('util');
var request = require('request');

var ob_resolver = require('./ob_resolver');

var ob_crawler = function (cmysql)
{
	var self = this;

	this.m_mysql = cmysql;

	this.save_ob_file = function (ob_file_data, ob_path)
	{
		if (fs.existsSync(ob_path))
		{
			fs.unlinkSync(ob_path);
		}

		fs.open(ob_path, 'w+', function (err1, fd)
		{
			if (err1)
			{
				console.log('%s Open OB file failed: %s, ob_path = %s'.error,
					new Date().getCurTime(), err1, ob_path);

				return;
			}

			fs.write(fd, ob_file_data, 0, ob_file_data.length, 0, function (err2, written, length)
			{
				fs.closeSync(fd);

				if (err2)
				{
					console.log('%s Write OB file failed: %s, ob_path = %s'.error,
						new Date().getCurTime(), err2, ob_path);

					return;
				}
			});
		});
	};

	this.save_ob_info = function (ob_file_data, resolver)
	{
		console.log('%s area_id = %d, game_id = %d, encryption_key = %s, platform_id = %s'.debug,
			new Date().getCurTime(),
			resolver.m_abstract.area_id,
			resolver.m_abstract.game_id,
			resolver.m_abstract.encryption_key,
			resolver.m_source.platformId);

		self.m_mysql.query('UPDATE ob_info SET game_id = ?, ob_file_status = 1, encryption_key = ?, platform_id = ?,\
			area_id = ?, game_start_time = ?, game_length = ?, participants = ?, banned = ? WHERE game_id = ?',
			[resolver.m_abstract.game_id,
			 resolver.m_abstract.encryption_key,
			 resolver.m_source.platformId,
			 resolver.m_abstract.area_id,
			 Math.round(resolver.m_source.gameStartTime / 1000.0),
			 resolver.m_abstract.game_length,
			 JSON.stringify(resolver.m_source.participants),
			 JSON.stringify(resolver.m_source.bannedChampions),
			 resolver.m_abstract.game_id], function (err1, results)
		{
			if (err1)
			{
				console.log('%s Update OB info status failed: %s, game_id = %d'.error,
					new Date().getCurTime(), err1, resolver.m_abstract.game_id);

				return;
			}

			var ob_dir = './' + resolver.m_source.platformId;
			var ob_path = ob_dir + '/' + resolver.m_abstract.game_id + '.ob';
			if (fs.existsSync(ob_dir))
			{
				self.save_ob_file(ob_file_data, ob_path);
			}
			else
			{
				fs.mkdir(ob_dir, function (err2)
				{
					if (null == err2)
					{
						self.save_ob_file(ob_file_data, ob_path);
					}
				});
			}
		});
	};

	this.get_ob_file = function (ob_url, game_id)
	{
		request.get(ob_url, { timeout : 20000 })
		.on('response', function (response)
		{
			if (200 != response.statusCode)
			{
				console.log('%s Download OB file failed: %d, url = %s'.error,
					new Date().getCurTime(), response.statusCode, ob_url);

				self.m_mysql.query('UPDATE ob_info SET ob_file_status = 255 WHERE game_id = ?', [game_id], function (err, ret)
				{
					if (err)
					{
						console.log('%s Update download failed OB file status failed: %s'.error,
							new Date().getCurTime(), err);

						return;
					}
				});

				return;
			}

			var buf_parts = [];
			response.on('data', function (data)
			{
				buf_parts.push(data);
			})
			.on('end', function ()
			{
				var ob_file_data = Buffer.concat(buf_parts);
				var resolver = ob_resolver.create_from_data(ob_file_data);
				self.save_ob_info(ob_file_data, resolver);
			})
			.on('error', function () {});
		})
		.on('error', function () {});
	};

	this.download_ob_file = function (game_id, ob_url)
	{
		self.m_mysql.query('SELECT ob_file_status FROM ob_info WHERE game_id = ?', [game_id], function (err1, rows, fields)
		{
			if (err1)
			{
				console.log('%s Query OB file status failed: err = %s, game_id = %d'.error,
						new Date().getCurTime(), err1, game_id);

				return;
			}

			if (rows.length > 1)
			{
				return;
			}

			if (1 == rows.length)
			{
				if (0 == rows[0].ob_file_status)
				{
					self.get_ob_file(ob_url, game_id);
				}

				return;
			}

			self.m_mysql.query('INSERT INTO ob_info(log_time, game_id, ob_file_status, ob_file_url) VALUES(?, ?, 0, ?)',
				[Math.round(new Date().getTime() / 1000.0), game_id, ob_url], function (err2, results)
			{
				if (err2)
				{
					console.log('%s Insert OB info failed: err = %s, game_id = %d'.error,
						new Date().getCurTime(), err2, game_id);

					return;
				}

				self.get_ob_file(ob_url, game_id);
			});
		});
	};

	this.resolve_ob_list = function (ob_list)
	{
		var map_ob_urls = {};
		if (undefined == ob_list.data ||
			!util.isArray(ob_list.data))
		{
			return map_ob_urls;
		}

		for (var i = 0; i < ob_list.data.length; i++)
		{
			var ob_data = ob_list.data[i];
			if (undefined == ob_data.game_id ||
				undefined == ob_data.down_url)
			{
				continue;
			}

			map_ob_urls[ob_data.game_id] = 'http://' + ob_data.down_url;
		}

		return map_ob_urls;
	};

	this.download_undone_ob_file = function ()
	{
		self.m_mysql.query('SELECT ob_file_url, game_id FROM ob_info WHERE ob_file_status = 0', function (err, rows, fields)
		{
			if (err)
			{
				console.log('%s Query undone OB files failed: err = %s'.error,
					new Date().getCurTime(), err);

				return;
			}

			for (var i = 0; i < rows.length; i++)
			{
				self.get_ob_file(rows[i].ob_file_url, rows[i].game_id);
			}
		});
	};

	this.start = function ()
	{
		self.download_undone_ob_file();

		request.get('http://api.pallas.tgp.qq.com/core/get_ob_list', { timeout : 2000 })
		.on('response', function (response)
		{
			if (200 != response.statusCode)
			{
				console.log('%s Get OB list failed: %d'.error,
					new Date().getCurTime(), response.statusCode);

				return;
			}

			var buf_parts = [];
			response.on('data', function (data)
			{
				buf_parts.push(data);
			})
			.on('end', function ()
			{
				var ob_list_obj = JSON.parse(Buffer.concat(buf_parts).toString('utf8'));
				var map_ob_urls = self.resolve_ob_list(ob_list_obj);
				// console.log('%s Crawled OB urls: %s'.debug,
					// new Date().getCurTime(),
					// JSON.stringify(map_ob_urls));

				for (var game_id in map_ob_urls)
				{
					self.download_ob_file(game_id, map_ob_urls[game_id]);
				}
			})
			.on('error', function () {});
		})
		.on('error', function () {});
	};
};

exports.create = function (cmysql)
{
	return new ob_crawler(cmysql);
};
