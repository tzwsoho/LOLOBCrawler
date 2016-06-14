
'use strict';

var CRAWL_INTERVAL = 600000;
var HTTP_PORT = 10108;
var CACHED_OB_DAYS = 30;
var MYSQL_OPTION = {
	host: '127.0.0.1',
    user: 'root',
    password: 'LexGame!@#321',
    database: 'torrents',
    port: 30306
};

var fs = require('fs');
var colors = require('colors');
var mysql = require('mysql');
var cmysql = mysql.createConnection(MYSQL_OPTION);

var ob_http = require('./ob_http');
var ob_crawler = require('./ob_crawler');

var m_last_timer = null;

Date.prototype.Format = function (fmt)
{
	var o = {
		"M+": this.getMonth() + 1,
		"d+": this.getDate(),
		"H+": this.getHours(),
		"m+": this.getMinutes(),
		"s+": this.getSeconds(),
		"q+": Math.floor((this.getMonth() + 3) / 3),
		"S": this.getMilliseconds()
	};

	if (/(y+)/.test(fmt))
	{
		fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
	}

	for (var k in o)
	{
		if (new RegExp("(" + k + ")").test(fmt))
		{
			fmt = fmt.replace(RegExp.$1,
				(RegExp.$1.length == 1) ?
					(o[k]) :
					(("00" + o[k]).substr(("" + o[k]).length)));
		}
	}

	return fmt;
};

Date.prototype.getCurTime = function ()
{
	return new Date().Format('yyyy-MM-dd HH:mm:ss');
};

process.on('SIGINT', function ()
{
	console.log('%s TZWSOHO LOL OB Crawler exiting...'.info,
		new Date().getCurTime());

	cmysql.end();
	process.exit();
});

function auto_crawl()
{
	var ob_crawler_inst = ob_crawler.create(cmysql);
	ob_crawler_inst.start();

	// delete expired OB files
	var expired_time = Math.round(new Date().getTime() / 1000.0) - CACHED_OB_DAYS * 24 * 3600;
	cmysql.query('SELECT game_id, platform_id FROM ob_info WHERE log_time < ?',
		[expired_time], function (err1, rows, fields)
	{
		if (err1)
		{
			console.log('%s Query expired OB file failed: %s'.error,
				new Date().getCurTime(), err1);

			return;
		}

		for (var i = 0; i < rows.length; i++)
		{
			var ob_file = './' + rows[i].platform_id + '/' + rows[i].game_id + '.ob';
			if (fs.existsSync(ob_file))
			{
				fs.unlink(ob_file, function (err2)
				{
					if (null == err2)
					{
						cmysql.query('UPDATE ob_info SET ob_file_status = 2 WHERE game_id = ' + rows[i].game_id,
							function (err3, results)
						{
							if (err3)
							{
								console.log('%s Update delete OB file status failed: %s, game_id = %d'.error,
									new Date().getCurTime(), err3, rows[i].game_id);

								return;
							}
						});

						console.log('%s Deleted expired OB file: %s'.info,
							new Date().getCurTime(), ob_file);
					}
					else
					{
						console.log('%s Delete expired OB file failed: %s, game_id = %d'.error,
							new Date().getCurTime(), err2, rows[i].game_id);
					}
				});
			}
		}
	});
}

(function ()
{
    colors.setTheme({
        debug : 'green',
        info : 'yellow',
        warn : 'magenta',
        error : 'red'
    });

	console.log('%s TZWSOHO LOL OB Crawler ver 2016-05-27, HTTP PORT = %d'.info,
		new Date().getCurTime(), HTTP_PORT);

	// init mysql
	cmysql.connect(function (err)
	{
		if (err)
		{
			console.log('%s MySQL connect failed: %s'.error,
				new Date().getCurTime(), err);

			return;
		}

		setInterval(function()
		{
			cmysql.ping();
		}, 30000);
	});

	var ob_http_inst = ob_http.create(HTTP_PORT, cmysql);
	ob_http_inst.start();

	auto_crawl();
	setInterval(auto_crawl, CRAWL_INTERVAL);
})();
