var http = require('http');
var https=require('https');
var qs = require('querystring');
var exec = require('child_process').exec;

var BRANCH  = process.argv[2];
var URL     = process.argv[3];
var COMMAND = process.argv[4];
var PORT    = process.argv[5];

var github_options = {
  hostname: 'api.github.com',
  port: 443,
  path: '/meta',
  method: 'GET'
};

http.createServer(function (req, res) {
  var body = '';
  req.on('data', function (data) {
    body += data;
    if(body.length > 2000) {
      req.connection.destroy;
    }
  });
  req.on('end', function () {
    var github_info = JSON.parse(qs.parse(body).payload);
    console.log(github_info.repository.url);
    if(github_info.ref == 'refs/heads/' + BRANCH && github_info.repository.url == URL) {
      var github_req = https.request(github_options, function(res) {
        var list = '';
        res.on('data', function(d) {
          list += d;
        });
        res.on('end', function() {
          if(testIpList(req.connection.remoteAddress, JSON.parse(list).hooks)) {
            child = exec(COMMAND,
               function (error, stdout, stderr) {
                 console.log('stdout: ' + stdout);
                 console.log('stderr: ' + stderr);
            });
          }
        });
      });
      github_req.end();
      github_req.on('error', function(e) {
        console.error(e);
      });
    }
  });
  res.writeHead(200, {'Content-Type': 'text/plain'});
  console.log("test:" + req.method);
  res.end("hi");
}).listen(PORT);

function testIpList(ip, ip_list) {
  var match = false;
  ip_list.some(function(cidr) {
    if(ipTest(ip,cidr)) {
      match=true;
      return true;
    }
  });
  return match;
}

function ipTest(ip, cidr) {
  var c      = cidr.split('/');
  var amount = Math.pow(2, 32 - parseInt(c[1]));
  var test   = ipValue(ip);
  var min    = ipValue(c[0]);
  return test >= min && test < min+amount;
}

function ipValue(ip) {
  var r = 0;
  ip.split('.').forEach(function(s) {
    r = r * 256 + parseInt(s);
  });
  return r;
}
