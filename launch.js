
'use strict';

var fs = require('fs');
var child_process = require('child_process');

var STDOUT_BUFFER_SIZE_MAX = 1024 * 1024 * 10;

process.on('SIGINT', function ()
{
	console.log('LOL OB Launcher exiting...');

	process.exit();
});

function print_usage()
{
	console.log('Usage: node %s {encryption_key} {game_id} {platform_id}', process.argv[1]);
}

(function ()
{
	if (process.argv.length < 5)
	{
		print_usage();
		return;
	}

	var lol_path = process.cwd();
	process.chdir(lol_path + '\\Game');
	var lol_process = child_process.execFile(
		lol_path + '\\Game\\League of Legends.exe',
		[ '0', "lol.launcher_tencent.exe",
		  lol_path + "\\Air\\LolClient.exe",
		  'spectator 182.254.229.133:80 ' +
		  process.argv[2] + ' ' + process.argv[3] + ' ' + process.argv[4]
		],
		{
			'maxBuffer' : STDOUT_BUFFER_SIZE_MAX,
			'env' : { '__COMPAT_LAYER' : 'ElevateCreateProcess' }
		},
		function (err, stdout, stderr)
		{
			if (err)
			{
				console.log('%s', err);
				return;
			}

			console.log('Execute OK!');
		}
	);

	lol_process.on('exit', function (code, signal)
	{
		console.log('League of Legends.exe exited: code = %d, signal = %s', code, signal);

		process.exit();
	});
})();
