import {
  Component,
  ChangeDetectorRef,
  Input,
  OnInit,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import './core/modules/WebSdk';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

import {
  FingerprintReader,
  SampleFormat,
  DeviceConnected,
  DeviceDisconnected,
  SamplesAcquired,
  AcquisitionStarted,
  AcquisitionStopped,
} from '@digitalpersona/devices';

import {
  Base64,
  Base64String,
  Base64UrlString,
  BioSample,
  Utf8,
  Utf8String,
} from '@digitalpersona/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'fingerprint';
  imageUrl: SafeUrl = '';
  ListaFingerPrintReader: any;
  InfoFingerPrintReader: any;
  ListaSamplesFingerPrints: any;
  CurrentImageFinger: any;

  private reader: FingerprintReader;

  constructor(private domSanitizer: DomSanitizer) {
    this.reader = new FingerprintReader();
  }

  private onDeviceConnected = (event: DeviceConnected) => {};
  private onDeviceDisconnected = (event: DeviceDisconnected) => {};
  private onAcquisitionStarted = (event: AcquisitionStarted) => {
    console.log('Evento: onAcquisitionStarted');
    console.log(event);
  };
  private onAcquisitionStopped = (event: AcquisitionStopped) => {
    console.log('Evento: onAcquisitionStopped');
    console.log(event);
  };

  private onSamplesAcquired = (event: SamplesAcquired) => {
    console.log('Evento: Adquisicion de imagen');
    console.log(event);

    // Ensure that the event contains the 'samples' array and it's not empty
    if (!event.samples || event.samples.length === 0) {
      console.log('No fingerprint samples found.');
      return;
    }

    // Extract the base64-encoded image data from the first element of the 'samples' array
    const rawData = event.samples[0] as unknown as Base64UrlString;

    // Decode the base64-encoded image data
    const base64ImageData: Base64String = Base64.fromBase64Url(rawData);

    // Construct the image URL using the base64-encoded image data
    const fingerprintImgString: SafeUrl =
      this.domSanitizer.bypassSecurityTrustUrl(
        `data:image/png;base64, ${base64ImageData}`
      );

    this.imageUrl = fingerprintImgString;

    console.log('Fingerprint image URL:', this.imageUrl);
  };

  ngOnInit() {
    this.reader = new FingerprintReader();
    this.reader.on('DeviceConnected', this.onDeviceConnected);
    this.reader.on('DeviceDisconnected', this.onDeviceDisconnected);
    this.reader.on('SamplesAcquired', this.onSamplesAcquired);

    this.fn_ListaDispositivos()
    .then(() => {
      return this.fn_DeviceInfo();
    })
    .catch((error) => {
      console.error('Error initializing and fetching device information:', error);
    });

  }
  ngOnDestroy() {
    this.reader.off('DeviceConnected', this.onDeviceConnected);
    this.reader.off('DeviceDisconnected', this.onDeviceDisconnected);
    this.reader.off('SamplesAcquired', this.onSamplesAcquired);
  }

  async fn_ListaDispositivos() {
    try {
      if (!this.reader) {
        console.error('Fingerprint reader is not initialized.');
        return;
      }
      this.ListaFingerPrintReader = await this.reader.enumerateDevices();
      console.log('Lista de dispositivos:');
      console.log(this.ListaFingerPrintReader);
    } catch (error) {
      console.error('Error enumerating devices:', error);
    }
  }

  async fn_DeviceInfo() {
    try {
      if (
        !this.reader ||
        !this.ListaFingerPrintReader ||
        this.ListaFingerPrintReader.length === 0
      ) {
        console.error(
          'Fingerprint reader or device list is not properly initialized.'
        );
        return;
      }

      const deviceInfo = await this.reader.getDeviceInfo(
        this.ListaFingerPrintReader[0]
      );
      this.InfoFingerPrintReader = deviceInfo;
      console.log('Device Information:');
      console.log(this.InfoFingerPrintReader);
    } catch (error) {
      console.error('Error getting device information:', error);
    }
  }

  async Fn_StartCapturaFP() {
    if (!this.reader) {
      console.error(
        'Fingerprint reader or device list is not properly initialized.'
      );
      return;
    }

    this.reader
      .startAcquisition(
        SampleFormat.PngImage,
        this.InfoFingerPrintReader['DeviceID']
      )
      .then((response) => {
        console.log('Capturando...');
        console.log(response);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  async Fn_StopCapturaFP() {
    if (!this.reader) {
      console.error(
        'Fingerprint reader or device list is not properly initialized.'
      );
      return;
    }
    this.reader
      .stopAcquisition(this.InfoFingerPrintReader['DeviceID'])
      .then((response) => {
        console.log('Dejando de capturar...');
        console.log(response);
        this.imageUrl = '';
      })
      .catch((error) => {
        console.log(error);
      });
  }
}
