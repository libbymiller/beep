//@@check the license before publishing
#include <stdio.h>
#include <math.h>
#include "portaudio.h"
#include <string.h>
#include <ifaddrs.h>
#include <netinet/in.h>
#include <stdio.h>

#define SAMPLE_RATE   (22050)
#define FRAMES_PER_BUFFER  (1024)

#ifndef M_PI
#define M_PI  (3.1415926536)
#endif

#define DURATION (150)
#define QUIET (50)

typedef struct
{
    float f1;    // frequency 1
    int phase1;  // internal phase
} paTestData;


char alphabet[] = "0123456789*#.|! abcdefghijklmnopqrstuvwxyz&";
const float hi = 3400.0;
const float low = 400.0;
float tones[200];
      
// encoding parameters
char start_array[] = {'#','*','#'};
//char dupe = '|';
//char caps = '!';


/* This routine will be called by the PortAudio engine when audio is needed.
** It may called at interrupt level on some machines so don't do anything
** that could mess up the system like calling malloc() or free().
*/
static int paCallback( const void *inputBuffer, void *outputBuffer,
                            unsigned long framesPerBuffer,
                            const PaStreamCallbackTimeInfo* timeInfo,
                            PaStreamCallbackFlags statusFlags,
                            void *userData )
{
    paTestData *data = (paTestData*)userData;
    unsigned long i;
    float *buf=(float *)outputBuffer;
    float temp1;

    (void) timeInfo; /* Prevent unused variable warnings. */
    (void) statusFlags;
    (void) inputBuffer;

    temp1=((2*M_PI)/SAMPLE_RATE)*data->f1;

    for( i=0; i<framesPerBuffer; i++ )
    {
        buf[i]=sin(data->phase1*temp1);
        if (++data->phase1==SAMPLE_RATE) data->phase1=0;
    }
    
    return paContinue;
}

/*
 * This routine is called by portaudio when playback is done.
 */
static void StreamFinished( void* userData )
{
   paTestData *data = (paTestData *) userData;
   printf( "Stream Completed\n");
}


// various methods to create array of tones

void fill_tones(){
   int az_len = (int)strlen(alphabet);
   printf("Alphabet is %s length is %i\n",alphabet,az_len);
   float increment = (hi - low)/az_len;
   printf("High is %f low is %f increment is %G\n",hi,low,increment);
   int i = 0;
   float freq = low;
   for (i = 0; i < az_len; i++){
     tones[i] = freq;
     //printf("i is %i,Tone is %G\n",i,tones[i]);
     freq = tones[i] + increment;
   }

}

// Play whatever was set up for a given duration + quiet time
void play(paTestData *data)
{
  Pa_Sleep(DURATION);
  data->f1 = 0.0;
  Pa_Sleep(QUIET);
}



//play tones represented by a string
void play_string(paTestData *data,char *str)
{
  int az_len = (int)strlen(alphabet);
  int count;

  while (*str) 
    {
      float freq;
      int digit = -1;
      int i =0;
      for (i = 0; i < az_len; i++){
        char item = alphabet[i];
        if(item==*str){
          freq = tones[i];
          digit = i;
        }
      }

      printf("Char is %c freq is %f\n",*str,freq);
      data->f1 = freq;
      freq = 0.0;

      if (digit>=0) play(data);
      str++;
    }

}


/* encode a string with
    a start code
    3 character length
    signals for capital letters and duplicates
    3 character checksum
*/


void encode_and_play(paTestData *data,char * str)
{
  printf("Encoding and playing %s\n",str);

  printf("string to encode is %s\n",str);
  int payloadLength = strlen(str);
  printf("payloadLength %i\n",payloadLength);

  char start_array[] = "#*#";
  char dupe = '|';
  char caps = '!';

  int len = payloadLength + 3 + 3 + strlen(start_array);
  char new_str[len];

  printf("new str length %i\n",len);

  int i;

  // add the start characters
  int zz = strlen(start_array);
  for(i=0; i < 3; i++){
     new_str[i] = start_array[i];
     printf("adding start array character %i %c\n",i,start_array[i]);
  }

  printf("new str %s\n",new_str);

  // add the payload length as a string

  char payloadLengthBuffer[4];

  sprintf(payloadLengthBuffer, "%d", payloadLength);
  printf("payloadLengthBuffer %s\n",payloadLengthBuffer);

  int payloadLengthBufferLength = strlen(payloadLengthBuffer);

  // pad with zeros

  if(payloadLengthBufferLength==1){
    printf("buf len is 1\n");
    new_str[i] = '0';
    new_str[i+1] = '0';
    new_str[i+2] = payloadLengthBuffer[0];
  }

  if(payloadLengthBufferLength==2){
    printf("buf len is 2\n");
    new_str[i] = '0';
    new_str[i+1] = payloadLengthBuffer[0];
    new_str[i+2] = payloadLengthBuffer[1];
  }

  if(payloadLengthBufferLength==3){
    printf("buf len is 3\n");
    new_str[i] = payloadLengthBuffer[0];
    new_str[i+1] = payloadLengthBuffer[1];
    new_str[i+2] = payloadLengthBuffer[2];
  }


  // add the payload
  int j;
  for(j=0;j<payloadLength;j++){
    new_str[i+3+j] = str[j];
  }

  // now add the checksum
  //just over the initial payload
  int total = 0;
  int l;
  for (l = 0; l < payloadLength; l++) {
     int num = str[l];
     //printf("checksum new_str %i\n",new_str[l]);
     total = total + num;
  }
  int checksum = 255 & total;

  //pad with zeros

  char checksumLengthBuffer[4];

  sprintf(checksumLengthBuffer, "%d", checksum);
  printf("checksumLengthBuffer %s\n",checksumLengthBuffer);

  int checksumLengthBufferLength = strlen(checksumLengthBuffer);

  // pad with zeros

  if(checksumLengthBufferLength==1){
    printf("buf len is 1\n");
    new_str[i+3+j] = '0';
    new_str[i+3+j+1] = '0';
    new_str[i+3+j+2] = checksumLengthBuffer[0];
  }

  if(checksumLengthBufferLength==2){
    printf("buf len is 2\n");
    new_str[i+3+j] = '0';
    new_str[i+3+j+1] = checksumLengthBuffer[0];
    new_str[i+3+j+2] = checksumLengthBuffer[1];
  }

  if(checksumLengthBufferLength==3){
    printf("buf len is 3\n");
    new_str[i+3+j] = checksumLengthBuffer[0];
    new_str[i+3+j+1] = checksumLengthBuffer[1];
    new_str[i+3+j+2] = checksumLengthBuffer[2];
  }


  //go through all that looking for duplicates and capitals  

  // hm dunno how big this should be - max of len + all of payload as caps?
  char result[len*2];

  int k;
  int count = 0;
  int argh = 0; //number of characters we need to add on 
  for(k=0;k<len;k++){
     printf("count is %i\n",count);
     int num = new_str[k];
     char character = new_str[k];
     char character2 = new_str[k+1];
     if (num>=65 && num<=90){ // capital letter
        int new_num = num + 32;
//        printf("str is %i and %c and %i and %c\n",character,character,new_num, new_num);
        result[count] = caps;
        printf("adding char[c] %c count is %i\n",caps,count);
        count++;
        argh++;
        result[count] = new_num;
        printf("adding char[c1] %c count is %i\n",new_num,count);
     }else{
       if (character==character2) { //casing?
         result[count] = dupe;
         printf("adding char %c[d] count is %i\n",dupe,count);
         count++;
         result[count] = character;
         printf("adding char %c[d2] count is %i\n",character,count);
         k++;
       }else{
         result[count] = character;
         printf("adding char %c count is %i\n",character,count);
       }
     }
     count++;
  }



  printf("---------- len is %i %i %i\n",len, argh, len+argh);
  char to_play[len+argh];//ahem
//  char  to_play[cc];
  int z;
  for(z=0;z<len+argh;z++){
     char character = result[z];
     to_play[z] = character;
    printf("char is %c\n",character);
  }
  to_play[z+1]='\0';//??

  play_string(data,to_play);  

}

void play_ip(paTestData *data)
{
    char * theip;

    struct ifaddrs * ifAddrStruct=NULL;
    struct ifaddrs * ifa=NULL;
    void * tmpAddrPtr=NULL;
    getifaddrs(&ifAddrStruct);
    for (ifa = ifAddrStruct; ifa != NULL; ifa = ifa->ifa_next) {
        if (ifa ->ifa_addr->sa_family==AF_INET) { // check it is IP4
            // is a valid IP4 Address
            tmpAddrPtr=&((struct sockaddr_in *)ifa->ifa_addr)->sin_addr;
            char addressBuffer[INET_ADDRSTRLEN];
            inet_ntop(AF_INET, tmpAddrPtr, addressBuffer, INET_ADDRSTRLEN);
            const char *str2 = "en0"; //wlan0 on the pi
            int v = strcmp (ifa->ifa_name, str2);
            if (v == 0) {
              printf("Ok - matched IP for en\n");
              printf("%s IP Address %s\n", ifa->ifa_name, addressBuffer);
              theip = addressBuffer;
              break;
            }else{
              printf("%s IP Address %s\n", ifa->ifa_name, addressBuffer);
            }
        } else if (ifa->ifa_addr->sa_family==AF_INET6) { // check it is IP6
            // is a valid IP6 Address
            tmpAddrPtr=&((struct sockaddr_in6 *)ifa->ifa_addr)->sin6_addr;
            char addressBuffer[INET6_ADDRSTRLEN];
            inet_ntop(AF_INET6, tmpAddrPtr, addressBuffer, INET6_ADDRSTRLEN);
            printf("%s IP Address %s\n", ifa->ifa_name, addressBuffer);
        }
   }
   printf("IP Address %s\n",theip);
   encode_and_play(data,theip);
}



/*******************************************************************/
int main (int argc, char *argv[])
{
    PaStreamParameters outputParameters;
    PaStream *stream;
    PaError err;
    paTestData data;
    int i;
    
    printf("Sample rate = %d, BufSize = %d\n", SAMPLE_RATE, FRAMES_PER_BUFFER);
    
    data.f1 = 0;
    
    err = Pa_Initialize();
    if( err != paNoError ) goto error;

    outputParameters.device = Pa_GetDefaultOutputDevice(); /* default output device */
    if (outputParameters.device == paNoDevice) {
      fprintf(stderr,"Error: No default output device.\n");
      goto error;
    }
    outputParameters.channelCount = 1;       /* stereo output */
    outputParameters.sampleFormat = paFloat32; /* 32 bit floating point output */
    outputParameters.suggestedLatency = Pa_GetDeviceInfo( outputParameters.device )->defaultLowOutputLatency;
    outputParameters.hostApiSpecificStreamInfo = NULL;

    err = Pa_OpenStream(
              &stream,
              NULL, /* no input */
              &outputParameters,
              SAMPLE_RATE,
              FRAMES_PER_BUFFER,
              paClipOff,      /* we won't output out of range samples so don't bother clipping them */
              paCallback,
              &data );
    if( err != paNoError ) goto error;

    err = Pa_SetStreamFinishedCallback( stream, &StreamFinished );
    if( err != paNoError ) goto error;

    err = Pa_StartStream( stream );
    if( err != paNoError ) goto error;

    //put the alphabet into an array
    fill_tones();

    // if just a single argument, assume it's a string to be played back as is
    if (argc == 2){
      printf("playing string %s\n",argv[1]);
      encode_and_play(&data,argv[1]);
//      play_string(&data,argv[1]);
    }else{
      //find the ip and play it, encoded
      printf("finding IP and playing it encoded\n");
      play_ip(&data);
    }

    err = Pa_StopStream( stream );
    if( err != paNoError ) goto error;

    err = Pa_CloseStream( stream );
    if( err != paNoError ) goto error;

    Pa_Terminate();
    printf("End.\n");
    
    return err;
error:
    Pa_Terminate();
    fprintf( stderr, "An error occured while using the portaudio stream\n" );
    fprintf( stderr, "Error number: %d\n", err );
    fprintf( stderr, "Error message: %s\n", Pa_GetErrorText( err ) );
    return err;
}

