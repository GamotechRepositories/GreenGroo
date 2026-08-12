import mongoose from 'mongoose';
import { FarmerHarvestOrder } from './farmer-manager-service/src/models.js';

const uri = "mongodb+srv://admin:admin123@cluster0.mongodb.net/test?retryWrites=true&w=majority"; 
// Wait, I need to know the MONGO_URI. Let me check backend/.env first.
