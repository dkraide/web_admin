import styles from './styles.module.scss';
import { InputHTMLAttributes,  forwardRef } from 'react';
import React from "react";

interface inputProps extends InputHTMLAttributes<HTMLInputElement> {
    title: string
    width?: string
    minWidth?: string
    invalid?: boolean
    error?: string
}

const InputGroup = ({title, width, minWidth, invalid, error, name,...rest }: inputProps) => {
    return (
        <div className={styles["group"]} style={{width: width || '100%', minWidth: minWidth || 'auto'}}>
            <span className={error ? styles["error"] : styles['']}>{error}</span>
            <input  type="text"  {...rest}  name={name}/>
            <span className={styles["bar"]}></span>
            <label>{title}</label>
        </div>
    )
}


interface inputForm extends InputHTMLAttributes<HTMLInputElement>{
    title: string
    width?: string
    minWidth?: string
    invalid?: boolean
    errors?: any
    register?: any,
    inputName: string,
    rules?: any

}
const InputForm = ({rules, title, width,minWidth, inputName, register, errors, ...rest } : inputForm) => {
    return (
        <div  style={{width: width || '100%', minWidth: minWidth }} className={styles["group"]}>
        <span className={errors[inputName] ? styles["error"] : styles['']}>{errors[inputName] && 'campo invalido'}</span>
        <input {...register(inputName, rules)} {...rest} />
        <span className={styles["bar"]}></span>
        <label>{title}</label>
        </div>
    );
  };


  const InputGroupRef = forwardRef<HTMLInputElement, inputProps>(function MyInput(props, ref) {
    const { title, width, minWidth, invalid, error, name,...rest  } = props;

    const style = {
        width: width || '100%',
        minWidth: minWidth || 'auto'
    }
    return (
        <div className={styles["group"]} style={{width: width || '100%', minWidth: minWidth || '300px'}}>
            <span className={error ? styles["error"] : styles['']}>{error}</span>
            <input ref={ref}  type="text"   name={name}/>
            <span className={styles["bar"]}></span>
            <label>{title}</label>
        </div>
    )
  });
  
export {InputForm, InputGroup, InputGroupRef};


