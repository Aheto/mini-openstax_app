// frontend/src/App.js 
import { useState, useEffect } from 'react';

function App() {  
    const [backendStatus, setBackendStatus] = useState(null);  
    const [loading, setLoading] = useState(true);  
    
    useEffect(() => {    
        const fetchHealth = async () => {      
            try {        
                // 🔑 This uses your .env variable        
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/health`);        
                const data = await response.json();        
                setBackendStatus(data);      
            } catch (err) {        
                setBackendStatus({ error: err.message });      
            } finally {        
                setLoading(false);      
            }    
        };    
        fetchHealth();  }, []);  
        if (loading) return <p>Loading backend status...</p>;  
        return (    
        <div style={{ padding: '2rem' }}>      
            <h1>Mini OpenStax MVP</h1>      
            <h2>📡 Backend Status:</h2>      
            <pre>{JSON.stringify(backendStatus, null, 2)}</pre>    
            </div>  
        );
    }
    
    export   default App;


    import checkIcon from '../assets/check-icon.svg';
import xIcon from '../assets/x-icon.svg';

// In JSX:
{feedback[item.id]?.correct ? (
  <img src={checkIcon} alt="Correct" />
) : (
  <img src={xIcon} alt="Incorrect" />

  
)}

<img src={logo} alt="OpenStax Mini" height="32" />
