import { useContext, useEffect, useState } from "react";
import { api } from "@/services/apiClient";
import { toast } from "react-toastify";
import { AxiosError, AxiosResponse } from "axios";
import { SelectBase } from "./SelectBase";
import _ from "lodash";
import IUsuario from "@/interfaces/IUsuario";
import { AuthContext } from "@/contexts/AuthContext";

interface selProps{
    selected: string
    setSelected: (value: any) => void
    width?: string
    title?: string
    onlyContador?: boolean
    onlySupervisor?: boolean
    includeGeral?: boolean
}

export  default function SelectUsuario({title, onlyContador, width, selected, setSelected, includeGeral, onlySupervisor}: selProps){
    const [formas, setFormas] = useState<IUsuario[]>([]);
    const {isInRole} = useContext(AuthContext);
    const loadFormas = async () => {
           api.get(`/User/List`)
           .then(({data}: AxiosResponse) => {
                   setFormas(data);
           })
           .catch((err: AxiosError) => {
               toast.error(`Erro ao buscar Usuarios ${err.message}`)
           });
    }
    useEffect(() => {
        loadFormas();
    }, []);
    function getData() {
        var data = [] as any[];
        formas.map((forma) => {
            if((!onlyContador || (onlyContador && forma.isContador)) && (!onlySupervisor || (onlySupervisor && isInRole(['SUPERVISOR'])))){
                var x = {
                    value: forma.userName?.toUpperCase(),
                    label: forma.userName?.toUpperCase() || ''
                }
                data.push(x);
            }
        });
        if(includeGeral){
            data.unshift({value: 'GERAL', label: 'GERAL'})
        }
        return data;
    }

    function onSelect(value: any) {
        if(includeGeral && value == 'GERAL'){
            setSelected('GERAL');
            return;
        }
        var index = _.findIndex(formas, p => p.userName?.toUpperCase() == value);
        if (index >= 0) {
            setSelected(formas[index]);
        }
    }

    return(
        <SelectBase width={width} datas={getData()} selected={selected?.toString()} title={title || 'Usuario'} setSelected={onSelect}/>
    )
}