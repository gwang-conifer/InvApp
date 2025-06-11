declare module 'react-native-smart-barcode' {
  import { Component } from 'react';
  import { ViewProps } from 'react-native';

  interface BarcodeScanEvent {
    data: string;
    type: string;
  }

  interface BarcodeProps extends ViewProps {
    onBarCodeRead?: (event: BarcodeScanEvent) => void;
    // Add any other props you know this component accepts
  }

  class Barcode extends Component<BarcodeProps> {}

  export default Barcode;
}