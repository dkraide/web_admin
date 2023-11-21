import Loading from '@/components/Loading';
import { ButtonHTMLAttributes } from 'react';
import Button from 'react-bootstrap/Button';

interface props extends  ButtonHTMLAttributes<HTMLButtonElement>{
    typeButton: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'dark'
    loading?: boolean
}

export default function CustomButton  ({loading, typeButton,children, onClick, ...rest}: props){
   return <Button variant={typeButton} onClick={onClick} disabled={loading} {...rest}>
    {loading ? <Loading/> : children}
   </Button>
}