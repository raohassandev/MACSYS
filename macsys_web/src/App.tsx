import DeviceForm from './components/DeviceForm';
import DeviceList from './components/DeviceList';
import OldDeviceForm from './components/oldDeviceForm';
const App = () => {
  return (
    <div className='p-6 max-w-4xl mx-auto'>
      <h1 className='text-3xl font-bold mb-4'>Device Manager</h1>
      <DeviceForm />
      <DeviceList />
      <OldDeviceForm />
    </div>
  );
};

export default App;
