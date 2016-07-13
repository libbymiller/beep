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
    document.getElementById("freq").innerHTML = "Frequency: "+freq;

    process_character(freq);

  }



  /* work out what to do with the character */

  function process_character(freq){
      var char = freq_to_char(freq);

      if(char && char!=last_char){
        result = result + "" + char;
        document.getElementById("result").innerHTML = char;
        var match = test_for_lament(); 
        if(match){
          document.getElementById("message").innerHTML = "RIGHT! "+match;
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
      if(str.indexOf("G3C4G3D#")!=-1){
//      if(str.indexOf("F4C4F4F#G4")!=-1 || str.indexOf("G3C4G3D#")!=-1){
         console.log("match!");
         return "G3C4G3D#";
      }else if(str.indexOf("C4F4F#G4")!=-1){
         console.log("match2!");
         return "C4F4F#G4";
      }else {
         console.log("no match!");
         return null;
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

    var argh = 5.00;
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


  /* play array of notes */

  function play_array(arr, len){

        console.log("arr");
        console.log(arr);

        var count = 0;
        var freq = freqs[count];
        console.log("playing "+freq);
        play_note(freq);

        var interval = setInterval(function(){
          if(freq){
            stop_playing_note(freq);
          }
          count = count+1;
          if(arr[count]){
            freq = arr[count].toString();

            if(!freq){
                 console.log(" key not found for "+j+" ");
            }else{
                 console.log("playing "+freq);
                 play_note(freq);
            }

          }else{
            clearInterval(interval);
          }
        },len);

   }



  /* create an oscillator for a given frequency */

  function create_oscillator(freq) {
    var source = context.createOscillator();
    source.connect(context.destination);
    source.frequency.value = freq;
    console.log("context");
    console.log(context);
//safari problem
    source.noteOn ? source.noteOn(0) : source.start(0);
    return source;
  }


  /* play a note */

  function play_note(freq){
    tones[freq.toString()] = create_oscillator(freq);
  }


  function stop_playing_note(freq){
//safari again
console.log("tones");
console.log(tones);
console.log("freq");
console.log(freq.toString());
    try{
     var note = tones[freq.toString()];

     note.stop(0);
    }catch(e){
       console.log(e);
       note.noteOff(0);
    }
    delete tones[freq.toString()];
  }


  function stop_listening(){
    console.log("STOPPING\n\n\n\n\n\n\n\n");
    if(the_interval){
      clearInterval(the_interval);
    }else{
      console.error("No interval to clear");
    }
  }

