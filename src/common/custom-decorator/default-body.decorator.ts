import { SetMetadata } from "@nestjs/common";
import { metadataKey } from "./types";

export const LinksGroup = (param:object)=>SetMetadata(metadataKey.linksGroup,param);