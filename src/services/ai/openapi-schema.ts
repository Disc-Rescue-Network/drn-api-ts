export default function () {
    const ExtractImageTextSchema = {
        type: 'object',
        required: [
            'image',
        ],
        properties: {
            image: {
                type: 'string',
                format: 'base64'
            },
        }
    }

    return {
        ExtractImageTextSchema
    }
}
