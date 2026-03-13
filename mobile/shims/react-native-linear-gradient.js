// Web shim: re-export expo-linear-gradient matching react-native-linear-gradient API
// react-native-linear-gradient uses requireNativeComponent which crashes on web.
// expo-linear-gradient uses CSS gradients on web and works out of the box.
import { LinearGradient } from 'expo-linear-gradient';
export { LinearGradient };
export default LinearGradient;
