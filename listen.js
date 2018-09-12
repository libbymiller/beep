  var freq_error;

  var result = [];

  var potential_start_array = [];

  var checksum = [];

  var payload_length;
  var payload_length_array = [];

  var last_char;

  var state;

  var State = {
    UNKNOWN: 1,
    LENGTH_CHARS: 2,
    CONTENT_CHARS: 3,
    CHECKSUM_CHARS: 4
  };

  var state = State.UNKNOWN;
  var data;

  /* populate arrays for keys and frequncies */

  function init(d){
    data = d;
    var increment = parseInt((hi - low)/alphabet.length);
    keys = alphabet.split("");
    var freq = low;
    for(var i=0; i<alphabet.length; i++){
      freqs[i] = freq;
      freq = freq + increment;
    }
    freq_error = increment / 3;

    console.log(keys);
    console.log(freqs);

  }

  /* check we have web audio api */

  function get_context(){

    context = new (window.AudioContext || window.webkitAudioContext)();
    console.log(context);

  }


  /* get microphone input */


  function get_microphone_input() {

    navigator.getMedia = ( navigator.getUserMedia ||
                       navigator.webkitGetUserMedia ||
                       navigator.mozGetUserMedia ||
                       navigator.msGetUserMedia);

    if(navigator.getMedia){

        navigator.getMedia({audio: true, video: false}, function(stream) {
            var analyser = context.createAnalyser();
            var microphone = context.createMediaStreamSource(stream);
            microphone.connect(analyser);
            process(analyser);
         }, function(e){alert(e);});

    }else{
       alert("no user audio");
    }

  }


  /* process audio */

  function process(analyser){
     var raw_freqs = new Uint8Array(analyser.frequencyBinCount);
     the_interval = setInterval(function(){
       analyser.getByteFrequencyData(raw_freqs);
       var amp, freq;
       decode(raw_freqs, freq, amp);
     },10);
  }



  /* process the data to get freq and amp */

  function decode(raw_freqs, freq, amp) {
    var max = -Infinity;
    var min = Infinity;
    var index = -1;
    for (var i = 0; i < raw_freqs.length; i++) {
      if (raw_freqs[i] > max) {
        max = raw_freqs[i];
        index = i;
      }
      if (raw_freqs[i] < max) {
        min = raw_freqs[i];
      }
    }

    amp = max - min;
    var nyquist = context.sampleRate/2;
    freq = nyquist/raw_freqs.length * index;
    document.getElementById("amp").innerHTML = "Amplitude: "+ amp;
    document.getElementById("freq").innerHTML = "Frequency: "+freq;

    data.shift();
    data.push({"time": new Date()/1000,"freq": freq/50, "amp": amp/10});
    redraw(data);

    process_character(freq);

  }



  /* work out what to do with the character */

  function process_character(freq){

    var char = freq_to_char(freq);

    // Ignore all received duplicates - these are dealt with using special characters
    // because you always get loads of them


    if (char && char != last_char){

       //console.log("CHAR "+char);

       if(state == State.UNKNOWN){
         // keep lookign for the start sequence
         var start_detected = detect_start_sequence(char);
         if(start_detected){
           result = [];
           state = State.LENGTH_CHARS;
           document.getElementById("result").innerHTML = "Start detected...listening";
         } 
      }else if(state == State.LENGTH_CHARS){

          //detect special characters
          if(last_char == dupe){
              payload_length_array.push(char);
              payload_length_array.push(char);
          }else if(char != dupe && char != caps){
              payload_length_array.push(char);
          }

          // assume payload length characters is alwyas 3 characters long
          if(payload_length_array.length == 3){
             payload_length = parseInt(payload_length_array.join(""));
             if(isNaN(payload_length)){
               var msg = "Payload length misheard - please try again";
               finish_up(msg,result);
             }else{
               state = State.CONTENT_CHARS;
               console.log("payload length "+payload_length);
               var z = document.getElementById("result");
               z.innerHTML = "Payload length is "+payload_length;
             }
          }

       }else if(state == State.CONTENT_CHARS){

          // detecting the content and the checksum together, because | and ! do weird stuff otherwise
          // in theory this could happen with the length bis too :-(

            //console.log("result.length "+result.length+" payload_length "+(payload_length+3)+"\n\n");
            if(char == dupe || char == caps){

            //don't add special characters

            }else if(last_char == dupe){ // double up
              result.push(char);
              result.push(char);
            }else if(last_char == caps){// letter boundary for caps
              var c = char.toUpperCase();
              result.push(c);
            }else{
              result.push(char);
            }

            //console.log("[2]result.length "+result.length+" payload_length "+(payload_length+3)+"\n\n");

            if (result.length >= payload_length + 3) { 
              //console.log("going into state checsum ");
              state = State.CHECKSUM;
            } 



       } 
       if(state == State.CHECKSUM){
            //take the last 3 characters found
            checksum = result.slice(result.length-3, result.length);
            console.log("CHECKSUM "+checksum);
            // assume three characters long
            if(checksum.length==3){
              var result_payload = result.slice(0,result.length-3);
              console.log("result_payload");
              console.log(result_payload);
              var check = generate_checksum(result_payload.join(""));
              var the_checksum = parseInt(checksum.join(""));
              console.log("check is "+check+" checksum "+the_checksum);
              var msg = "checksum matches";
              if(parseInt(check)!=the_checksum){
                msg = "checksum doesn't match";
              }
              finish_up(msg,result_payload);

            }else{

              // handle checksum characters
              if(last_char == dupe){
                checksum.push(char);
                checksum.push(char);
              }else if(char != dupe && char != caps){
                checksum.push(char);
              }
              if(checksum.length>=3){//fixme - stop anyway for now
                 finish_up("something odd happened");             
              }
            }
       } 

       last_char = char;
    }
  }


  /* finish up */

  function finish_up(msg,result_payload){
              // we are finished - stop and clear everything
              console.log("\n\nENDING\nRESULT: ");
              console.log(result_payload)
              document.getElementById("result").innerHTML = result_payload.join("")+" : "+msg;
              result = [];
              payload_length_array = [];
              payload_length = 0;
              potential_start_array = [];

              state = State.UNKNOWN;

  }


  /* convert freqs to chars */

  function freq_to_char(freq) {
    for (var i in freqs){
      if (( freq > freqs[i]-freq_error) && (freq < freqs[i]+freq_error )){
        var match = freqs[i];
        var result = keys[i];
        return result;
      }
    }

  }

  /* stop listening and processing */

  function stop_listening(){
    console.log("STOPPING\n\n\n\n\n\n\n\n");
    if(the_interval){
      clearInterval(the_interval);
    }else{
      console.error("No interval to clear");
    }
  }


  /* compare start sequence */

  function detect_start_sequence(char){
      potential_start_array.push(char);
      var len = start_array.length;

      //chop it down to stop it getting huge

      if(potential_start_array.length > len){
        potential_start_array = potential_start_array.slice(potential_start_array.length-len);
      }

      //compare the last chars
      if(start_array[len-1]==char){

        for(var i=0; i<start_array.length; i++){
          if(start_array[i] != potential_start_array[i]){
            return false;
          }
        }

      }else{
        return false;
      }
      potential_start_array = []; //reset
      return true;
  }


  /* generate a checksum from a string */

  function generate_checksum(str){
       //see http://stackoverflow.com/questions/18729405/how-to-convert-utf8-string-to-byte-array
       var utf8 = unescape(encodeURIComponent(str));

       var total = 0;
       for (var i = 0; i < utf8.length; i++) {
         var byte = utf8.charCodeAt(i);
         total = total + byte;
       }
       var checksum = 255 & total;
       console.log("checksum is "+checksum);
       return checksum;
  }


