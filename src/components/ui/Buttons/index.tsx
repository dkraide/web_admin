import Loading from '@/components/Loading';
import { ButtonHTMLAttributes } from 'react';
import Button from 'react-bootstrap/Button';
import styles from './styles.module.scss'

interface props extends  ButtonHTMLAttributes<HTMLButtonElement>{
    typeButton: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'dark',
    size?: 'sm' | 'lg'
    loading?: boolean
}

export default function CustomButton  ({loading, typeButton,children, onClick, size, ...rest}: props){
   return <Button size={size} variant={typeButton} onClick={onClick} disabled={loading} {...rest} className={styles[typeButton]}>
    {loading ? <Loading/> : children}
   </Button>
}