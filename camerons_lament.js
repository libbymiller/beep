  var freq_error;

  var result = "";

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
    try {
      //AudioContext()is mozilla
      context = AudioContext();
    }
    catch (e) {
      console.log("Browser does not support Web Audio API as AudioContext(), trying another");
    }

    try{
      if(!context){
        context = new AudioContext();
        console.log("context ok");
        console.log(context);
      }
    }
    catch (e) {
      console.log("Browser does not support Web Audio API as new AudioContext(), trying another");
    }
    try{
      if(!context){
        context = new webkitAudioContext();
      }
    }
    catch (e) {
      console.log("Browser does not support Web Audio API as webkitAudioContext(), trying another");
    }

    try{
      if(!context){
        context = window.audioContext;
      }
    }
    catch (e) {
      console.error("Browser does not support Web Audio API: window.audioContext - all failed");
      return false;
    }
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
    //document.getElementById("amp").innerHTML = "Amplitude: "+ amp;
    //document.getElementById("freq").innerHTML = "Frequency: "+freq;

    process_character(freq);

  }



  /* work out what to do with the character */

  function process_character(freq){
      var char = freq_to_char(freq);

      if(char && char!=last_char){
        result = result + "" + char;
        document.getElementById("result").innerHTML = char;
        if(test_for_lament()==true){
          document.getElementById("message").innerHTML = "RIGHT!";
          result = "";
          setTimeout(function(){ document.getElementById("message").innerHTML = ""; }, 3000);
        }
      }
      if(char){
        last_char = char;
      }
      if(result.length>100){
        result = "";
      }
  }


  function test_for_lament(){
      var str = result;
      console.log("str "+str);
      if(str.indexOf("GCGD#")!=-1){
         console.log("match!");
         return true;
      }else{
         console.log("no match!");
         return false;
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
//              if(the_interval){
  //              clearInterval(the_interval);
    //          }

              state = State.UNKNOWN;
//              stop_listening();

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

