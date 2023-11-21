import { useEffect, useState } from "react";
import { api } from "@/services/apiClient";
import { toast } from "react-toastify";
import { AxiosError, AxiosResponse } from "axios";
import IClasseMaterial from "@/interfaces/IClasseMaterial";
import { SelectBase } from "./SelectBase";
import _ from "lodash";
import IUsuario from "@/interfaces/IUsuario";

interface selProps{
    selected: string;
    setSelected: (value: any) => void;
    width?: string;
}

export  default function SelectUsuario({width, selected, setSelected}: selProps){
    const [formas, setFormas] = useState<IUsuario[]>([]);
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
            var x = {
                value: forma.userName?.toUpperCase(),
                text: forma.userName?.toUpperCase() || ''
            }
            data.push(x);
        });
        return data;
    }

    function onSelect(value: any) {
        var index = _.findIndex(formas, p => p.userName?.toUpperCase() == value);
        if (index >= 0) {
            setSelected(formas[index]);
        }
    }

    return(
        <SelectBase width={width} datas={getData()} selected={selected?.toString()} title={'Usuario'} setSelected={onSelect}/>
    )
}