  /* populate arrays for keys and frequncies */

  function init(){

    var increment = parseInt((hi - low)/alphabet.length);
    keys = alphabet.split("");
    var freq = low;
    for(var i=0; i<alphabet.length; i++){
      freqs[i] = freq;
      freq = freq + increment;
    }

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

  /* play a note at a given frequency */


  function play_note(freq){
    tones[freq.toString()] = create_oscillator(freq);
  }  

  /* stop playing a note at a given frequency */

  function stop_playing_note(freq){
//safari again
    try{
     var note = tones[freq.toString()];
     note.stop(0);
    }catch(e){
       console.log(e);
       note.noteOff(0);
    }
    delete tones[freq];
  }

  /* encode a string with
    a start code
    3 character length
    signals for capital letters and duplicates 
    3 character checksum 
  */

  function encode(text){
        console.log("playing "+text);
        var payloadLength = text.length;
        var arr = text.split("");
        var arr2 = [];

        //add the specified start code
        for(var i=0; i < start_array.length; i++){
             arr2.push(start_array[i]);
        }

        //add the length bits
        var tmpArr = (""+payloadLength).split("");
        if(tmpArr.length<3){
          for(var i = 0; i<(3 - tmpArr.length+1);i++){
            tmpArr.unshift("0");//dunno if it should be an int or char, don't think it matters
          }
        }
        for(var i=0; i< tmpArr.length; i++){
          arr2.push(tmpArr[i]);
        }

        //add the actual text
        for(var i=0; i< arr.length; i++){
          arr2.push(arr[i]);
        }

        //add the checksum
        var checksum = generate_checksum(text);

        var tmpArr = (""+checksum).split("");
        if(tmpArr.length<3){
          for(var i = 0; i<(3 - tmpArr.length+1);i++){
            tmpArr.unshift("0");//dunno if it should be an int or char, don't think it matters
          }
        }
        for(var i=0; i< tmpArr.length; i++){
          arr2.push(tmpArr[i]);
        }


        //process everything for duplicates and capitals
        var ip = [];

        for(var i=0; i<arr2.length; i++){
          var character = arr2[i];
          if (character != character.toLowerCase()){ // detect capital letters
              ip.push(caps);
          }
          if(arr2[i+1] && arr2[i+1].toLowerCase() == character.toLowerCase()){
            //@@ question - what if upper and lowercase same letter?
            ip.push(dupe);
            i++;
          }
          ip.push(character.toLowerCase());
        }

        console.log("playing "+ip+" length "+payloadLength+" checksum "+checksum);
        return ip;

    }


   /* create a checksum over a string*/

   function generate_checksum(str){
       //see http://stackoverflow.com/questions/18729405/how-to-convert-utf8-string-to-byte-array
       var utf8 = unescape(encodeURIComponent(str));

       var total = 0;
       for (var i = 0; i < utf8.length; i++) {
         var byte = utf8.charCodeAt(i);
         console.log("checksum new_str "+byte);
         total = total + byte;
       }
       var checksum = 255 & total;
       console.log("checksum is "+checksum);
       return checksum;
   }


   /* play a list of tones in an array */

   function play_array(arr, len, log){

        console.log("arr");
        console.log(arr);
        var count = 0;

        var i = arr[count].toString();
        var index = keys.indexOf(i);
        var freq;

        if(index < 0){
           log.innerHTML = " key not found for "+i+" /// "; // new message
           console.log(" key not found for "+i+" /// ");
        }else{
           freq = freqs[index];
           log.innerHTML =  " " + i + " ";
           console.log("playing "+freq);
           play_note(freq);
        }

        var interval = setInterval(function(){
          if(freq){
            stop_playing_note(freq);
          }
          count = count+1;
          if(arr[count]){
            var j = arr[count].toString();
            var index = keys.indexOf(j);
            freq = freqs[index];

            if(!freq){
                 log.innerHTML = log.innerHTML + " key not found for "+j+" !!! "; 
                 console.log(" key not found for "+j+" ");
            }else{
                 log.innerHTML =  log.innerHTML + "" + j + " ";
//["+freq+"]";
                 console.log("playing "+freq);
                 play_note(freq);
            }

          }else{
            clearInterval(interval);
          }
        },len);


   }



