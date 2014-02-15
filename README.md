beep
====

Basic [Frequency Shift Keying](http://en.wikipedia.org/wiki/Frequency-shift_keying) using Web Audio API 
and C with Portaudio. This is a way to map characters to frequencies, which can be audible or not.

This is a work in progress. Licensing needs sorting out and the whole thing needs cleaning up. There's 
no C receiving code yet. The tones need improving.

Many thanks to Richard Sewell for hints and the loan of 
[Sklar](http://www.amazon.co.uk/Digital-Communications-Fundamentals-Applications-Engineering/dp/0130847887/ref=sr_1_1) 
which I've not read yet :-)

Thanks to Richard and Danbri for doing a bunch of [thinking about this 
stuff](http://music.columbia.edu/pipermail/dorkbotbristol-blabber/2010-April.txt) [in 
2010](http://wiki.foaf-project.org/w/DanBri/ChirpChirp) where they were looking at [Digital 
Voices](https://www.ics.uci.edu/~lopes/dv/dv.html).

Audio is one way of out of band token-passing instead of QR codes or pin numbers, or for example for 
connecting devices to a network. The second of these is the application we're currently thinking of, for 
our [Radiodan](http://radiodan.github.io) work.

Using it
========

For the C code:

Install portaudio bits:

    sudo apt-get install portaudio19-dev

compile:

    gcc beep.c -o beep -lportaudio

then:

    ./beep Hello

to play a sample IP address.

For the Web Audio API, you may need to put it on a web server. Load each of beep.html and listen.html in a
browser that does web audio and web RTC (chrome or firefox). Play one and allow the other to listen via the
microphone.

You can serve the page locally by doing something this:

    ruby -r webrick -e "m =  WEBrick::HTTPUtils::DefaultMimeTypes; m.store 'mp4', 'video/mp4'; m.store 'svg', 'image/svg+xml'; s = WEBrick::HTTPServer.new(:Port => 4000, :DocumentRoot => Dir.pwd); trap('INT') { s.shutdown }; s.start"`


Useful links
============

* [Subaudible python implementation](https://github.com/Katee/quietnet) (This is what got me interested recently)
* [A web audio api version of something similar](http://smus.com/ultrasonic-networking/) with a nice explanation
* We wanted something noisy. Most similar perhaps is [Chirp](http://chirp.io/tech/#sthash.8x6ypBMA.dpuf)
* [This article on portaudio](http://blog.bjornroche.com/2012/07/frequency-detection-using-fft-aka-pitch.html) is the best I've found for a beginner like me
* Though these articles were very useful [The Sounds of Raspberry](http://www.drdobbs.com/embedded-systems/the-sounds-of-raspberry/240158180) and [Raspberry Sounds Continued](http://www.drdobbs.com/embedded-systems/raspberry-sounds-continued/240158605)
* I used [THis example from portaudio](https://github.com/eddieringle/portaudio/blob/master/examples/paex_record.c) as the basis for the C code.

A few interesting vaguely related things:

* [Mystery signal from a helicopter](http://www.windytan.com/2014/02/mystery-signal-from-helicopter.html)
* [The sound of the dialup, pictured](http://www.windytan.com/2012/11/the-sound-of-dialup-pictured.html)
* [TRISTAN PERICH 1-BIT SYMPHONY](http://www.1bitsymphony.com/)


