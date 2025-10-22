import { Redirect } from 'expo-router';
import menu from '@/components/Menu';

export default function Index() {
  return <Redirect href={"/home"} />;
}