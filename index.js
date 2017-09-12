var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var net = require('net');
var mysql = require('mysql');


var connection = mysql.createConnection({
  host     : '106.14.151.3',
  user     : 'root',
  password : 'Password01?',
  database : 'management'
});

var chatServer = net.createServer();

cabinet_list = [];
reply_msg = {};
var onlineCount = 0;

function is_magic(data)
{
    var data0 = data[0];
    var data1 = data[1];
    var data2 = data[2];
    var data3 = data[3];
    if((data0.toString(16) == 53) && (data1.toString(16) == 49) && (data2.toString(16) == '4f') && (data3.toString(16) == 54))
    {
        return true;
    }
    else{
        return false;
    }
}

function get_ver(data)
{
    var ver = data[4];
    return ver;
}

function get_type(data)
{
    var type = data[5];
    return type;
}

function get_SN(data)
{
    var SN = [data[6], data[7]];
    return SN;
}

function get_code(data)
{
    var code = data[8] + data[9];
    return code;
}

function get_format(data)
{
    var format = data[10];
    return format;
}

function get_M(data)
{
    var M = data[11];
    return M;
}

function get_payloadlength(data)
{
    var payloadlength = data[12] + data[13] + data[14] + data[15];
    return payloadlength;
}

function get_timestamp(data)
{
    var timestamp = data[16] + data[17] + data[18] + data[19] + data[20] + data[21] + data[22] + data[23];
    return timestamp;
}


function get_cabinet_id(data)
{
    var cabinet_id = data[24] + data[25] + data[26] + data[27] + data[28] + data[29] + data[30] + data[31];
    return cabinet_id;
}

function get_token(data)
{

    var cabinet_id = data[32] + data[33] + data[34] + data[35] + data[36] + data[37] + data[38] + data[39];
    return token;
}

function build_reply(msg_type, SN, code, format, M, payload, timestamp, srcID, desID, token)
{
    var msg = new Buffer(40);
    msg[0] = 83;
    msg[1] = 73;
    msg[2] = 79;
    msg[3] = 84;
    // ver
    msg[4] = 1;
    msg[5] = msg_type;
    msg[6] = SN[0];
    msg[7] = SN[1];
    msg[8] = code[0];
    msg[9] = code[1];
    msg[10] = format;
    msg[11] = M;
    msg[12] = payload[0];
    msg[13] = payload[1];
    msg[14] = payload[2];
    msg[15] = payload[3];
    msg[16] = timestamp[0];
    msg[17] = timestamp[1];
    msg[18] = timestamp[2];
    msg[19] = timestamp[3];
    msg[20] = timestamp[4];
    msg[21] = timestamp[5];
    msg[22] = timestamp[6];
    msg[23] = timestamp[7];
    msg[24] = srcID[0];
    msg[25] = srcID[1];
    msg[26] = srcID[2];
    msg[27] = srcID[3];
    msg[28] = srcID[4];
    msg[29] = srcID[5];
    msg[30] = srcID[6];
    msg[31] = srcID[7];
    msg[32] = desID[0];
    msg[33] = desID[1];
    msg[34] = desID[2];
    msg[35] = desID[3];
    msg[36] = desID[4];
    msg[37] = desID[5];
    msg[38] = desID[6];
    msg[39] = desID[7];
    msg[40] = token[0];
    msg[41] = token[1];
    msg[42] = token[2];
    msg[43] = token[3];
    msg[44] = token[4];
    msg[45] = token[5];
    msg[46] = token[6];
    msg[47] = token[7];
    return msg;
}

function get_array4(r){
    var b = new Buffer(4);
    b[0] = r >> 24 & 0xff;
    b[1] = r >> 16 & 0xff;
    b[2] = r >> 8 & 0xff;
    b[3] = r & 0xff;
    return b;
}

function get_array8(r){
    var b = new Buffer(8);
    b[0] = r >> 56 & 0xff;
    b[1] = r >> 48 & 0xff;
    b[2] = r >> 40 & 0xff;
    b[3] = r >> 32 & 0xff;
    b[4] = r >> 24 & 0xff;
    b[5] = r >> 16 & 0xff;
    b[6] = r >> 8 & 0xff;
    b[7] = r & 0xff;
    return b;
}

function get_timestamp()
{
    var timestamp = new Date().getTime();
    console.log(timestamp);
    return timestamp;
}

function getJsonObjLength(jsonObj) {
    var Length = 0;
    for (var item in jsonObj) {
        Length++;
    }
    return Length;
}


chatServer.on('connection', function(client) {

    client.on('data', function(data){
        console.log(data.toJSON());
        var data_json = data.toJSON().data;
        var magic = is_magic(data_json);
        var cabinet_id = '';
        if(magic === true)
        {
            cabinet_id = get_cabinet_id(data_json); 
            var cabinet_exist = false;
            for(var c in cabinet_list)
            {
                if(cabinet_list[c].cabinet_id === cabinet_id)
                {   
                    cabinet_list[c].handle = client;
                    cabinet_list[c].head = data_json;
                    cabinet_exist = true;
                }
            }
            if(cabinet_exist === false)
            {
                var cabinet = {'cabinet_id':cabinet_id, 'handle':client, 'head':data_json,'payload':'', 'crc': ''};
                cabinet_list.push(cabinet);
            }
        }
        else
        {
            for(var c in cabinet_list)
            {
                if(cabinet_list[c].handle === client)
                {
                    cabinet_id = cabinet_list[c].cabinet_id;
                    var head_data = cabinet_list[c].head;
                    var payload_length = get_payloadlength(head_data);
                    if(payload_length === 0)
                    {
                        cabinet_list[c].crc = data_json;
                    }
                    else
                    {
                        if(cabinet_list[c].payload === '')
                        {
                            cabinet_list[c].payload = data_json;
                        }
                        else
                        {
                            cabinet_list[c].crc = data_json;
                        }
                    }
                }
            }
        }

        for(var c in cabinet_list)
        {
            if(cabinet_list[c].handle === client)
            {
                if(cabinet_list[c].crc !== '')
                {
                    var msg_type = get_type(data);
                    if(msg_type === 1)
                    {
                        var msg_reply_type = 2;
                        var SN = get_SN(data);
                        var code = [1,0];
                        var format = 1;
                        var M = 0;
                        var server_id = 1001;
                        var server_name = 'server1';
                        var payload_reply = {'id': server_id, 'name': server_name, 'addr': '182.61.58.155', 'port': 2137};
                        var payload_reply_length = JSON.stringify(payload_reply).length;
                        console.log('payload reply length is '+ payload_reply_length);
                        var payloadlength = get_array4(payload_reply_length);
                        var timestamp = get_timestamp();
                        var timestamp_bytes = get_array8(timestamp);
                        var server_id_bytes = get_array8(server_id);
                        var destID_bytes = get_array8(0);
                        var token_bytes = get_array8(0);
                        var msg = build_reply(msg_reply_type, SN, code, format, M, payloadlength, timestamp_bytes,server_id_bytes, destID_bytes, token_bytes);
                        client.write(msg);
                        console.log('msg send successfully');

                        client.write(JSON.stringify(payload_reply));
                        client.write(get_array4(0));
                        console.log('payload send successfully');
                    }
                }
            }
        }


        
        //client.write('world\r\n');
        //var token = '';
        //var token_cabinet_id = 'cabinet_id';
	
        //var verify_code = '001';
        //if(cabinet_id == token_cabinet_id && verify_code == '001')
        //{
            //if(!cabinet_list.hasOwnProperty(cabinet_id))
            //{
              //  cabinet_list[cabinet_id] = client;
                //onlineCount++;
                //var reply_code = '';
                //if(reply_code == '')
                //{
                  //  var reply_msg = '';
                    //var to = cabinet_openid[cabinet_id];
                    //var target = onlines[to];
                    //var from = 'server';
                   // if(target)
                    //{
                      //  target.emit('pmsg', from, to, reply_msg);
                    //}
               // }
            //}
       // }
        //else
        //{
          //  console.log('Invalid equipment');
       // }
    });

    client.on('end', function(data){
        var cabinet_id = 'cabinet_id';
        console.log('cabinet id ' + cabinet_id + 'end');             
        delete cabinet_list[cabinet_id];
        onlineCount--;
    });
    client.on('error', function(e){
        console.log(e);
    });
});

chatServer.listen(2137);


app.get('/', function(req, res){
    res.send('<h1>Welcome Realtime Server</h1>');
});

onlines = {};
cabinet_openid = {}

var onlineCount = 0;

io.on('connection', function(socket){
    console.log('a client connected');

    socket.on('join', function(obj){
        socket.name = obj.username;
        if(!onlines.hasOwnProperty(obj.username)){
            onlines[obj.username] = socket;
        }
        console.log(obj.username+'login');
        
    });

    socket.on('disconnect', function(){
        if(onlines.hasOwnProperty(socket.name)){
            var obj = {username:onlines[socket.name]};
            delete onlines[socket.name];
            onlineCount--;

            console.log(obj.username + 'logout');
        }
    });

    socket.on('private_message', function(from, to, msg){
        var target = onlines[to];
        if(target)
        {
            var cabinet_id = msg.split('&')[0];
            cabinet_openid[cabinet_id] = to;
            var send_msg = '';
            cabinet_list[cabinet_id].write(send_msg);
            //var return_msg = msg.split('&')[1] + '_success';
            //target.emit('pmsg', from, to, return_msg);
        }
    });    

});



http.listen(2136, function(){
	console.log('listening on *:2136');
});
