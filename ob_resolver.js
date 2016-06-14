
'use strict';

var fs = require('fs');
var util = require('util');

var ob_resolver = function ()
{
	var self = this;

	this.m_ob_file = '';

	this.m_abstract = null;
	this.m_source = null;
	this.m_obmeta = null;
	this.m_keyframe_tab = null;
	this.m_chunk_tab = null;

	// this.m_chunk_data = null;
	this.m_chunks = {};
	this.m_keyframes = {};
	this.m_chunk_data_tab = {};
	this.m_keyframe_data_tab = {};

	this.m_max_chunk_id = 0;
	this.m_current_chunk_id = 0;
	this.m_current_keyframe_id = 1;

	this.resolve_ob_data = function (ob_file_data)
	{
		var ob_magic = ob_file_data.slice(0, 5).toString('utf8');
		if ('LOLOB' != ob_magic)
		{
			console.log('%s Not legal LOL OB format: %s'.error,
				new Date().getCurTime(), ob_magic);

			return null;
		}

		var abstract_re = /^(?:abstract:).+(?=\r\n)/gim;
		var abstract_str = abstract_re.exec(ob_file_data).toString('utf8').substr('abstract:'.length);
		self.m_abstract = JSON.parse(abstract_str);

		var source_re = /^(?:source:).+(?=\r\n)/gim;
		var source_str = source_re.exec(ob_file_data).toString('utf8').substr('source:'.length);
		self.m_source = JSON.parse(source_str);

		var obmeta_re = /^(?:obmeta:).+(?=\r\n)/gim;
		var obmeta_str = obmeta_re.exec(ob_file_data).toString('utf8').substr('obmeta:'.length);
		self.m_obmeta = JSON.parse(obmeta_str);

		var keyframe_tab_re = /^(?:keyframe_tab:).+(?=\r\n)/gim;
		var keyframe_tab_str = keyframe_tab_re.exec(ob_file_data).toString('utf8').substr('keyframe_tab:'.length);
		self.m_keyframe_tab = JSON.parse(keyframe_tab_str);

		var chunk_tab_re = /^(?:chunk_tab:).+(?=\r\n)/gim;
		var chunk_tab_str = chunk_tab_re.exec(ob_file_data).toString('utf8').substr('chunk_tab:'.length);
		self.m_chunk_tab = JSON.parse(chunk_tab_str);

		// console.log('%s OB info:\nabstract = %s\nsource = %s\nobmeta = %s\nkeyframe_tab = %s\nchunk_tab = %s'.debug,
			// new Date().getCurTime(),
			// abstract_str, source_str, obmeta_str, keyframe_tab_str, chunk_tab_str);

		if (!util.isArray(self.m_keyframe_tab) ||
			!util.isArray(self.m_chunk_tab))
		{
			console.log('%s Not legal LOL OB format: keyframe_tab = %s, chunk_tab = %s'.error,
				new Date().getCurTime(), keyframe_tab_str, chunk_tab_str);

			return null;
		}

		for (var i = 0; i < self.m_keyframe_tab.length; i++)
		{
			if (2 != self.m_keyframe_tab[i].length)
			{
				console.log('%s Not legal LOL OB format: keyframe_tab = %s, i = %d'.error,
					new Date().getCurTime(), keyframe_tab_str, i);

				return null;
			}

			var key = self.m_keyframe_tab[i][0]; // keyframe_id
			var value = self.m_keyframe_tab[i][1]; // chunk_id
			self.m_keyframes[value] = key; // NOTICE: chunk_id - keyframe_id
		}

		for (var i = 0; i < self.m_chunk_tab.length; i++)
		{
			if (2 != self.m_chunk_tab[i].length)
			{
				console.log('%s Not legal LOL OB format: chunk_tab = %s, i = %d'.error,
					new Date().getCurTime(), chunk_tab_str, i);

				return null;
			}

			var key = self.m_chunk_tab[i][0]; // chunk_id
			var value = self.m_chunk_tab[i][1]; // duration
			self.m_chunks[key] = value;

			if (key > self.m_max_chunk_id)
			{
				self.m_max_chunk_id = key;
			}
		}

		var istart = ob_file_data.toString().indexOf('\r\n\r\n') + 4;
		while (istart < ob_file_data.length)
		{
			var ob_type = ob_file_data.readUInt8(istart);
			var ob_index = ob_file_data.readUInt16BE(istart + 1);
			var ob_len = ob_file_data.readUInt32BE(istart + 3);
			var ob_start = istart + 7;
			if (1 == ob_type) // chunk
			{
				// self.m_chunk_data_tab[ob_index] = [ ob_start, ob_start + ob_len ];
				self.m_chunk_data_tab[ob_index] = ob_file_data.slice(ob_start, ob_start + ob_len);
			}
			else if (2 == ob_type) // keyframe
			{
				// self.m_keyframe_data_tab[ob_index] = [ ob_start, ob_start + ob_len ];
				self.m_keyframe_data_tab[ob_index] = ob_file_data.slice(ob_start, ob_start + ob_len);
			}

			istart += 7 + ob_len; // sizeof(ob_chunk_header) = 7
		}
	};

	this.resolve_ob_file = function (ob_file)
	{
		self.m_ob_file = ob_file;

		var ob_file_data = fs.readFileSync(ob_file);
		if (null == ob_file_data)
		{
			return;
		}

		self.resolve_ob_data(ob_file_data);

		// console.log('%s OB info:\nabstract = %s\nsource = %s\nobmeta = %s\nkeyframe_tab = %s\nchunk_tab = %s'.debug,
			// new Date().getCurTime(),
			// JSON.stringify(self.m_abstract),
			// JSON.stringify(self.m_source),
			// JSON.stringify(self.m_obmeta),
			// JSON.stringify(self.m_keyframe_tab),
			// JSON.stringify(self.m_chunk_tab));
	};

	this.get_encryption_key = function ()
	{
		if (null == self.m_abstract)
		{
			return '';
		}

		return self.m_abstract.encryption_key;
	};

	this.get_game_id = function ()
	{
		if (null == self.m_abstract)
		{
			return 0;
		}

		return self.m_abstract.game_id;
	};

	this.get_platform_id = function ()
	{
		if (null == self.m_source)
		{
			return '';
		}

		return self.m_source.platformId;
	};

	this.get_featured = function ()
	{
		return 'for test';
	};

	this.get_version = function ()
	{
		if (null == self.m_abstract)
		{
			return null;
		}

		return self.m_abstract.ob_ver;
	};

	this.get_game_meta_data = function (platform_id, game_id)
	{
		return self.m_obmeta;
	};

	this.get_last_chunk_info = function (platform_id, game_id, param)
	{
		self.m_current_chunk_id++;
		var duration = self.m_chunks[self.m_obmeta.startGameChunkId];
		if (self.m_current_chunk_id > self.m_obmeta.startGameChunkId &&
			self.m_current_chunk_id <= self.m_max_chunk_id)
		{
			self.m_obmeta.startGameChunkId = self.m_current_chunk_id;
			duration = self.m_chunks[self.m_current_chunk_id];
			if (null != self.m_keyframes[self.m_current_chunk_id])
			{
				self.m_current_keyframe_id++;
			}
		}

		var chunk_info = {
			'chunkId' : self.m_obmeta.startGameChunkId,
			'availableSince' : 32502, // TODO constant ?
			'nextAvailableChunk' : 26976, // TODO constant ?
			'keyFrameId' : self.m_current_keyframe_id,
			'nextChunkId' : self.m_obmeta.startGameChunkId,
			'endStartupChunkId' : self.m_obmeta.endStartupChunkId,
			'startGameChunkId' : self.m_obmeta.startGameChunkId,
			'endGameChunkId' : self.m_max_chunk_id,
			'duration' : duration
		};

		// console.log('%s get_last_chunk_info: %s'.info,
			// new Date().getCurTime(),
			// JSON.stringify(chunk_info));

		return chunk_info;
	};

	this.get_game_data_chunk = function (platform_id, game_id, chunk_id)
	{
		return self.m_chunk_data_tab[chunk_id];
	};

	this.get_keyframe = function (platform_id, game_id, keyframe_id)
	{
		return self.m_keyframe_data_tab[keyframe_id];
	};
};

exports.create = function (ob_file)
{
	var resolver = new ob_resolver();
	resolver.resolve_ob_file(ob_file);
	return resolver;
};

exports.create_from_data = function (ob_file_data)
{
	var resolver = new ob_resolver();
	resolver.resolve_ob_data(ob_file_data);
	return resolver;
};
